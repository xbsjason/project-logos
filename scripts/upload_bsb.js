import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = './scripts/serviceAccountKey.json';
const dataPath = './bsb_data.json';

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: scripts/serviceAccountKey.json not found.');
    console.error('Please download your service account key from Firebase Console > Project Settings > Service Accounts.');
    process.exit(1);
}

if (!fs.existsSync(dataPath)) {
    console.error('Error: bsb_data.json not found.');
    console.error('Please run "node scripts/process_bsb.js" first.');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadBible() {
    console.log(`Starting upload for ${data.version} - ${data.books.length} books...`);

    const bibleRef = db.collection('bibles').doc('bsb');
    await bibleRef.set({
        id: 'bsb',
        name: 'Berean Study Bible',
        abbreviation: 'BSB',
        language: 'en',
        copyright: 'Berean Bible'
    });

    let batch = db.batch();
    let operationCount = 0;
    const BATCH_LIMIT = 400;

    async function commitBatch() {
        if (operationCount > 0) {
            console.log(`Committing batch of ${operationCount} operations...`);
            await batch.commit();
            batch = db.batch();
            operationCount = 0;
        }
    }

    for (const book of data.books) {
        const bookRef = bibleRef.collection('books').doc(book.id);

        batch.set(bookRef, {
            id: book.id,
            name: book.name,
            order: book.order,
            chapterCount: book.chapters.length
        });
        operationCount++;

        if (operationCount >= BATCH_LIMIT) await commitBatch();

        for (const chapter of book.chapters) {
            const chapterRef = bookRef.collection('chapters').doc(String(chapter.number));

            batch.set(chapterRef, {
                number: chapter.number,
                verses: chapter.verses
            });
            operationCount++;

            if (operationCount >= BATCH_LIMIT) await commitBatch();
        }
        console.log(`Processed Book: ${book.name}`);
    }

    await commitBatch();
    console.log('Upload complete!');
}

uploadBible().catch(console.error);
