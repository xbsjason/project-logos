import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export interface BibleBook {
    id: string;
    name: string;
    order: number;
    chapterCount: number;
}

export interface BibleVerse {
    verse: number;
    text: string;
}

export interface BibleChapter {
    number: number;
    verses: BibleVerse[];
}

const BIBLE_ID = 'bsb'; // Hardcoded for now, could be dynamic later

export const BibleService = {
    async getBooks(): Promise<BibleBook[]> {
        try {
            const booksRef = collection(db, 'bibles', BIBLE_ID, 'books');
            const q = query(booksRef, orderBy('order'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BibleBook));
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    },

    async getChapter(bookId: string, chapterNum: number): Promise<BibleChapter | null> {
        try {
            const chapterRef = doc(db, 'bibles', BIBLE_ID, 'books', bookId, 'chapters', String(chapterNum));
            const snapshot = await getDoc(chapterRef);

            if (!snapshot.exists()) return null;
            return snapshot.data() as BibleChapter;
        } catch (error) {
            console.error(`Error fetching chapter ${bookId} ${chapterNum}:`, error);
            throw error;
        }
    }
};
