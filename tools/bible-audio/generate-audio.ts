import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { loadBibleData } from './bible-loader.js';
import { synthesizeToFile } from './tts-client.js';
import { validateConfig } from './validate.js';
import { AudioConfig, VerseMetadata } from './types.js';
import { getAudioPath, getChapterPath, getMetadataPath, shouldGenerate, ensureDirectory } from './audio-utils.js';
import { generateManifest } from './manifest.js';

// Simple args parser
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed: Record<string, any> = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].replace(/^--/, '');
            const value = args[i + 1];
            // Handle booleans (flags without values)
            if (value === undefined || value.startsWith('--')) {
                parsed[key] = true;
            } else {
                parsed[key] = value;
                i++;
            }
        }
    }
    return parsed;
}

async function main() {
    const args = parseArgs();

    // Load config
    const configPath = path.resolve('tools/bible-audio/config.local.json');
    let config: AudioConfig = require('./config.example.json');
    if (fs.existsSync(configPath)) {
        const localConfig = require(configPath);
        config = { ...config, ...localConfig };
    }

    // Override config with CLI args
    if (args.translation) config.translation = args.translation;
    if (args.voiceId) config.voiceId = args.voiceId;
    if (args.speakingRate) config.speakingRate = parseFloat(args.speakingRate);
    if (args.pitch) config.pitch = parseFloat(args.pitch);
    if (args.volume) config.volume = parseFloat(args.volume);

    if (args.dryRun) config.dryRun = true;
    if (args.force) config.force = true;
    if (args.book) config.book = args.book;
    if (args.chapter) config.chapter = parseInt(args.chapter, 10);
    if (args.upload) config.upload = true;

    validateConfig(config);

    console.log(`Starting generation for ${config.translation}...`);
    console.log(`Config: Rate=${config.speakingRate}, Pitch=${config.pitch}, Voice=${config.voiceId}`);
    if (config.dryRun) console.log("DRY RUN MODE: No files will be written.");

    const possiblePaths = [
        config.translation, // Check if translation is a direct path
        path.resolve(config.translation),
        path.resolve(`data/bible/${config.translation}.json`),
        path.resolve(`data/bible/${config.translation}.jsonl`),
        path.resolve(`bible-import/output/${config.translation.toLowerCase()}.jsonl`), // Added lookup for legacy
    ];

    let dataPath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            dataPath = p;
            break;
        }
    }

    if (!dataPath) {
        throw new Error(`Could not find Bible data for '${config.translation}'. Search paths: ${possiblePaths.join(', ')}`);
    }

    // Auto-detect translation name from filename if using loose path
    if (config.translation.includes('/') || config.translation.endsWith('.jsonl')) {
        // keep config.translation as is or derive? 
        // Better to let user specify clean translation name in config/args, 
        // but if they pass a file path as translation arg, we might want to clean it up.
        // For now, let's assume they passed a name like 'KJV' which mapped to `bible-import/output/kjv.jsonl`
    }
    const allVerses = await loadBibleData(dataPath);

    // Filter verses
    let verses = allVerses;
    if (args.book) {
        verses = verses.filter(v => v.book.toLowerCase().includes(args.book.toLowerCase()));
    }
    // Only filter by chapter if explicitly provided (and not 0/NaN)
    // We treat chapter=0 as "All Chapters" in UI, which passes as args.chapter=0
    if (args.chapter && parseInt(args.chapter) > 0) {
        verses = verses.filter(v => v.chapter === parseInt(args.chapter, 10));
    }

    console.log(`Found ${verses.length} verses to process.`);
    if (verses.length === 0) {
        console.log("No verses found matching criteria.");
        return;
    }

    if (config.upload) {
        // Dynamically import upload service
        try {
            const { uploadFile, saveToFirestore, checkExists } = await import('./upload-service.js');
            console.log("Upload enabled: Initializing Firebase...");

            // Note: We might want to batch this or just do one by one
            // Let's do one by one for simplicity first
            for (let i = 0; i < verses.length; i++) {
                const verse = verses[i];
                const audioPath = getAudioPath(config.outputRoot, config.translation, verse.book, verse.chapter, verse.verse, config.format);
                const jsonPath = getMetadataPath(config.outputRoot, config.translation, verse.book, verse.chapter, verse.verse);
                const chapterDir = getChapterPath(config.outputRoot, config.translation, verse.book, verse.chapter);

                // Prep metadata
                const nextVerse = verses[i + 1] ? verses[i + 1] : null; // Logic needs refinement for cross-chapter
                // Simplified next/prev link logic
                const nextLink = nextVerse ? `${nextVerse.book.toLowerCase().replace(/\s+/g, '_')}_${nextVerse.chapter}_${nextVerse.verse}.${config.format}` : undefined;

                const metadata: VerseMetadata = {
                    text: verse.text,
                    duration: 0,
                    next: nextLink
                };

                // 1. Generation
                let generated = false;
                if (shouldGenerate(audioPath, jsonPath, config.force || false)) {
                    ensureDirectory(chapterDir);
                    try {
                        if (!config.dryRun) {
                            await synthesizeToFile({
                                text: verse.text,
                                voiceId: config.voiceId,
                                config,
                                outPath: audioPath
                            });
                            fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));
                            generated = true;
                            console.log(`Generated: ${path.basename(audioPath)}`);
                        } else {
                            console.log(`[DRY] Would generate: ${audioPath}`);
                        }
                    } catch (err: any) {
                        console.error(`FAILED Gen: ${path.basename(audioPath)} - ${err.message}`);
                        continue;
                    }
                } else {
                    console.log(`Skipping Gen (Exists): ${path.basename(audioPath)}`);
                }

                // 2. Upload
                if (config.upload && !config.dryRun) {
                    const storagePath = `bible-audio/${config.translation}/${verse.book}/${verse.chapter}/${path.basename(audioPath)}`;
                    const firestoreId = `${config.translation}_${verse.book}_${verse.chapter}_${verse.verse}`;

                    try {
                        // Check if already in Firestore? (Optional optimization)
                        const exists = await checkExists('bible_verses', firestoreId);
                        if (exists && !config.force) {
                            console.log(`Skipping Upload (Exists): ${path.basename(audioPath)}`);
                            continue;
                        }

                        console.log(`Uploading: ${path.basename(audioPath)}...`);
                        const publicUrl = await uploadFile(audioPath, storagePath, 'audio/wav'); // Assume wav for piper

                        await saveToFirestore('bible_verses', firestoreId, {
                            translation: config.translation,
                            book: verse.book,
                            chapter: verse.chapter,
                            verse: verse.verse,
                            text: verse.text,
                            audioUrl: publicUrl,
                            storagePath: storagePath,
                            updatedAt: new Date()
                        });
                        console.log(`Uploaded & Saved: ${path.basename(audioPath)}`);
                    } catch (err: any) {
                        console.error(`FAILED Upload: ${path.basename(audioPath)} - ${err.message}`);
                    }
                }
            }

        } catch (e: any) {
            console.error("Upload initialization failed:", e.message);
        }
        return;
    }

    // Non-upload flow (Regular generation)
    // Reuse existing loop logic but updated for filtering
    for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];
        const audioPath = getAudioPath(config.outputRoot, config.translation, verse.book, verse.chapter, verse.verse, config.format);
        const jsonPath = getMetadataPath(config.outputRoot, config.translation, verse.book, verse.chapter, verse.verse);
        const chapterDir = getChapterPath(config.outputRoot, config.translation, verse.book, verse.chapter);

        // Prep metadata
        const nextVerse = verses[i + 1] ? verses[i + 1] : null;
        const prevVerse = verses[i - 1] ? verses[i - 1] : null;
        const nextLink = nextVerse ? `${nextVerse.book.toLowerCase().replace(/\s+/g, '_')}_${nextVerse.chapter}_${nextVerse.verse}.${config.format}` : undefined;
        const prevLink = prevVerse ? `${prevVerse.book.toLowerCase().replace(/\s+/g, '_')}_${prevVerse.chapter}_${prevVerse.verse}.${config.format}` : undefined;

        const metadata: VerseMetadata = {
            text: verse.text,
            duration: 0,
            next: nextLink,
            previous: prevLink
        };

        if (config.dryRun) {
            console.log(`[DRY] Would generate: ${audioPath}`);
            continue;
        }

        if (!shouldGenerate(audioPath, jsonPath, config.force || false)) {
            console.log(`Skipping existing: ${path.basename(audioPath)}`);
            continue;
        }

        ensureDirectory(chapterDir);

        try {
            await synthesizeToFile({
                text: verse.text,
                voiceId: config.voiceId,
                config,
                outPath: audioPath
            });

            fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

            console.log(`Generated: ${path.basename(audioPath)}`);
        } catch (err: any) {
            console.error(`FAILED: ${path.basename(audioPath)} - ${err.message}`);
        }
    }

    if (!config.dryRun) {
        generateManifest(config.outputRoot, config.translation);
    }

    console.log("Done.");
}

main().catch(console.error);
