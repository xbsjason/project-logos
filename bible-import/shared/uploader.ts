
import * as admin from 'firebase-admin';
import * as fs from 'fs-extra';
import * as readline from 'readline';
import { VerseRecord } from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from both local and root if needed, but usually just local .env
dotenv.config();

// Ensure creds
if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn("Available env vars:", Object.keys(process.env));
    throw new Error("Missing FIREBASE_PROJECT_ID in .env");
}

if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    } catch (e) {
        console.error("Failed to initialize Firebase Admin", e);
        process.exit(1);
    }
}

const db = admin.firestore();

export async function uploadFile(
    filePath: string,
    versionDoc: { id: string, name: string, source_url: string, license: string },
    options: { resumeKey?: string } = {}
) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // 1. Create/Update Version Doc
    // Collection: bibles (as decided)
    // Doc: {version}
    const versionRef = db.collection('bibles').doc(versionDoc.id);
    await versionRef.set({
        version: versionDoc.id,
        name: versionDoc.name,
        source_url: versionDoc.source_url,
        license_note: versionDoc.license,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Version doc set for ${versionDoc.id}`);

    // 2. Upload verses
    const versesCollection = versionRef.collection('verses');

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let batch = db.batch();
    let count = 0;
    let total = 0;
    const BATCH_SIZE = 500;

    let skimming = !!options.resumeKey;

    for await (const line of rl) {
        if (!line.trim()) continue;
        const verse: VerseRecord = JSON.parse(line);

        // Use key as doc ID: "KJV:gen:1:1" -> "gen_1_1" to save space? 
        // Or just use the key provided in the record? 
        // User said: "docId: `${bookId}_${chapter}_${verse}` (or hash)"
        const docId = `${verse.bookId}_${verse.chapter}_${verse.verse}`;

        if (skimming) {
            if (docId === options.resumeKey) {
                skimming = false;
                console.log(`Resuming after ${docId}...`);
            }
            continue;
        }

        // Add to batch
        // Remove 'version' from field if stored at parent?
        // User: "fields: VerseRecord without repeating “version” if stored at parent"
        const { version, ...verseData } = verse;

        const docRef = versesCollection.doc(docId);
        batch.set(docRef, verseData);

        count++;
        total++;

        if (count >= BATCH_SIZE) {
            await batch.commit();
            process.stdout.write(`\rUploaded ${total} verses for ${versionDoc.id}...`);
            batch = db.batch();
            count = 0;
            // Rate limit slightly
            await new Promise(res => setTimeout(res, 100));
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`\nFinal batch committed.`);
    }

    console.log(`Upload complete for ${versionDoc.id}. Total: ${total}`);
}
