import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// @ts-ignore
const require = createRequire(import.meta.url);
const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());
// Serve the public folder statically for previews
app.use('/public', express.static(path.resolve('public')));

interface JobStatus {
    id: string;
    isRunning: boolean;
    logs: string[];
    fullLog: string;
    command: string;
}

let currentJob: JobStatus = {
    id: '',
    isRunning: false,
    logs: [],
    fullLog: '',
    command: ''
};

// Helper: Scan for available translations
function getAvailableTranslations() {
    const translations = new Set<string>();

    // Check data/bible
    if (fs.existsSync('data/bible')) {
        fs.readdirSync('data/bible').forEach(f => {
            if (f.endsWith('.json') || f.endsWith('.jsonl')) {
                translations.add(path.parse(f).name);
            }
        });
    }

    // Check bible-import/output
    if (fs.existsSync('bible-import/output')) {
        fs.readdirSync('bible-import/output').forEach(f => {
            if (f.endsWith('.jsonl')) {
                translations.add(path.parse(f).name.toUpperCase());
            }
        });
    }

    return Array.from(translations);
}

// Helper: Estimate progress
function getTranslationProgress(translation: string) {
    const audioDir = path.join('public/audio/bible', translation);
    if (!fs.existsSync(audioDir)) return { created: false, books: 0, chapters: 0 };

    // Count books directory
    const books = fs.readdirSync(audioDir).filter(f => fs.statSync(path.join(audioDir, f)).isDirectory());

    // Count total chapters (rough estimate)
    let totalChapters = 0;
    books.forEach(book => {
        const bookDir = path.join(audioDir, book);
        const chapters = fs.readdirSync(bookDir).filter(f => fs.statSync(path.join(bookDir, f)).isDirectory());
        totalChapters += chapters.length;
    });

    return { created: true, books: books.length, chapters: totalChapters };
}

// GET /api/progress
app.get('/api/progress', (req, res) => {
    const translations = getAvailableTranslations();
    const progress = translations.map(t => ({
        translation: t,
        ...getTranslationProgress(t)
    }));
    res.json(progress);
});

// GET /api/books
app.get('/api/books', (req, res) => {
    try {
        const translation = (req.query.translation as string) || 'BSB';
        let dataPath = path.resolve(`data/bible/${translation}.json`);

        // Try other common paths if not found
        if (!fs.existsSync(dataPath)) {
            // Check for uppercased/lowercased variations
            if (fs.existsSync(path.resolve(`data/bible/${translation.toUpperCase()}.json`))) {
                dataPath = path.resolve(`data/bible/${translation.toUpperCase()}.json`);
            } else if (fs.existsSync(path.resolve(`bible-import/output/${translation.toLowerCase()}.jsonl`))) {
                dataPath = path.resolve(`bible-import/output/${translation.toLowerCase()}.jsonl`);
            } else {
                return res.status(404).json({ error: 'Translation data not found' });
            }
        }

        const books = new Set<string>();

        if (dataPath.endsWith('.json')) {
            const verses = require(dataPath);
            verses.forEach((v: any) => books.add(v.book));
        } else {
            // JSONL support (simple stream read for headers might be better but reading all for now)
            const content = fs.readFileSync(dataPath, 'utf-8');
            content.split('\n').forEach(line => {
                if (!line.trim()) return;
                try {
                    const row = JSON.parse(line);
                    books.add(row.bookName || row.book);
                } catch (e) { }
            });
        }

        res.json({ books: Array.from(books) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/status
app.get('/api/status', (req, res) => {
    res.json(currentJob);
});

// POST /api/preview
app.post('/api/preview', async (req, res) => {
    const { text, voiceId, speakingRate, pitch, volume } = req.body;

    // Create a temp file
    const tempDir = path.resolve('public/temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `preview_${timestamp}.mp3`;
    const outPath = path.join(tempDir, filename);
    const publicUrl = `/public/temp/${filename}`; // Served via static middleware

    try {
        // Need to read config to get base URL? or passed in?
        const configPath = path.resolve('tools/bible-audio/config.local.json');
        let config = require('./config.example.json');
        if (fs.existsSync(configPath)) {
            const localConfig = require(configPath);
            config = { ...config, ...localConfig };
        }

        const ttsUrl = `${config.ttsBaseUrl}/api/tts?text=${encodeURIComponent(text)}&voiceId=${voiceId}&rate=${speakingRate}&pitch=${pitch}&volume=${volume}`;

        const response = await fetch(ttsUrl);
        if (!response.ok) throw new Error(`TTS Error: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(outPath, Buffer.from(arrayBuffer));

        res.json({ url: publicUrl });

    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/generate
app.post('/api/generate', (req, res) => {
    if (currentJob.isRunning) {
        return res.status(409).json({ error: 'A job is already running' });
    }

    const { translation = 'BSB', book, chapter, force, dryRun, voiceId, speakingRate, pitch, volume } = req.body;

    // Construct args
    const args = ['tools/bible-audio/generate-audio.ts'];
    if (translation) args.push('--translation', translation);
    if (book) args.push('--book', book);
    if (chapter) args.push('--chapter', chapter.toString());
    if (force) args.push('--force');
    if (dryRun) args.push('--dryRun');
    if (req.body.upload) args.push('--upload');

    // New Audio Options
    if (voiceId) args.push('--voiceId', voiceId);
    if (speakingRate) args.push('--speakingRate', speakingRate.toString());
    if (pitch) args.push('--pitch', pitch.toString());
    if (volume) args.push('--volume', volume.toString());

    currentJob = {
        id: Date.now().toString(),
        isRunning: true,
        logs: [],
        fullLog: '',
        command: `npm run bible:audio:run -- ${args.slice(1).join(' ')}` // approximation for display
    };

    const child = spawn('npx', ['tsx', ...args], {
        cwd: process.cwd(),
        shell: true
    });

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line: string) => {
            if (line.trim()) {
                currentJob.logs.push(line);
                currentJob.fullLog += line + '\n';
                // Keep log size manageable
                if (currentJob.logs.length > 100) currentJob.logs.shift();
            }
        });
    });

    child.stderr.on('data', (data) => {
        const line = `[ERR] ${data.toString()}`;
        currentJob.logs.push(line);
        currentJob.fullLog += line + '\n';
    });

    child.on('close', (code) => {
        currentJob.isRunning = false;
        const msg = `Process exited with code ${code}`;
        currentJob.logs.push(msg);
        currentJob.fullLog += msg + '\n';
    });

    res.json({ success: true, jobId: currentJob.id });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bible Audio Server running at http://0.0.0.0:${PORT}`);
});
