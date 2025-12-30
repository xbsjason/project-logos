import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PROTESTANT_BOOKS } from '../constants/bibleData';

// We will use bible-api.com for BSB (or Web/KJV if BSB not available, BSB is usually available or we use WEB)
// Actually bible-api.com default is WEB. 
// BSB might not be available on simple public APIs due to copyright?
// BSB is "Berean Study Bible" - Open but maybe not on all APIs.
// Let's use WEB (World English Bible) for "bsb" slot if that's easier, OR just use WEB as content.
// Wait, the app defaults to 'bsb'. If I seed 'web' text into 'bsb' slot, it's misleading but works for "testing".
// Better: Check if bible-api supports BSB.
// https://bible-api.com/john+1?translation=bsb -> might work.

const BASE_URL = 'https://bible-api.com';
const VERSION = 'web'; // World English Bible is safe public domain

async function fetchChapter(book: string, chapter: number) {
    try {
        const response = await fetch(`${BASE_URL}/${book}+${chapter}?translation=${VERSION}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${book} ${chapter}`, error);
        return null;
    }
}

export const seedBibleBook = async (bookId: string) => {
    const bookInfo = PROTESTANT_BOOKS.find(b => b.id === bookId);
    if (!bookInfo) {
        console.error(`Book ${bookId} not found in constants`);
        return;
    }

    console.log(`Seeding ${bookInfo.name} (${bookInfo.chapterCount} chapters)...`);

    // In the service, 'bsb' reads from: bibles/bsb/books/{bookId}/chapters/{chapterNum}
    // We will populate this "BSB" slot with WEB text for now to ensure the app works.

    // We can't use a single batch for the whole book if it's large (limit 500 ops).
    // So we do chunks.

    const chunkSize = 20;

    for (let i = 1; i <= bookInfo.chapterCount; i += chunkSize) {
        const chunk = [];
        for (let j = 0; j < chunkSize && i + j <= bookInfo.chapterCount; j++) {
            chunk.push(i + j);
        }

        await processChunk(bookInfo, chunk);
    }
};

async function processChunk(bookInfo: any, chapters: number[]) {
    const batch = writeBatch(db);
    let opCount = 0;

    const promises = chapters.map(async (chapterNum) => {
        const data = await fetchChapter(bookInfo.name, chapterNum);
        if (!data) return;

        // Transform to our schema
        // API returns: { reference: 'Genesis 1', verses: [ { book_id: 'GEN', book_name: 'Genesis', chapter: 1, verse: 1, text: '...' } ] }

        // Target: bibles/bsb/books/{bookId}/chapters/{chapterNum}
        // content: { number: 1, verses: [ { verse: 1, text: "..." } ] }

        const verses = data.verses.map((v: any) => ({
            verse: v.verse,
            text: v.text.replace(/\n/g, ' ').trim()
        }));

        const docRef = doc(db, 'bibles', 'bsb', 'books', bookInfo.id, 'chapters', String(chapterNum));
        batch.set(docRef, {
            number: chapterNum,
            verses: verses
        });
        opCount++;
    });

    await Promise.all(promises);

    if (opCount > 0) {
        await batch.commit();
        console.log(`Committed chunk ${chapters[0]}-${chapters[chapters.length - 1]} for ${bookInfo.name}`);
    }
}

export const seedKeyBooks = async () => {
    // Seed Genesis, Psalms, John, Romans
    const keys = ['GEN', 'PSA', 'JHN', 'ROM'];
    for (const key of keys) {
        await seedBibleBook(key);
    }
    console.log("Seeding of key books complete.");
};
