import { PROTESTANT_BOOKS } from '../constants/bibleData';

export interface ParsedVerse {
    bookId: string;
    chapter: number;
    verse: number;
    version?: string;
}

export function parseVerseReference(ref: string): ParsedVerse | null {
    if (!ref) return null;

    // Pattern: [Book Name] [Chapter]:[Verse]
    // Handles book names with spaces/numbers like "1 John", "Song of Solomon"
    // Regex: Match everything until the last space as book name, then digits:digits
    const match = ref.match(/^(.+)\s(\d+):(\d+)(?:-\d+)?$/);

    if (!match) return null;

    const [, bookName, chapterStr, verseStr] = match;
    const cleanBookName = bookName.trim();
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);

    // Find Book ID
    const book = PROTESTANT_BOOKS.find(b =>
        b.name.toLowerCase() === cleanBookName.toLowerCase() ||
        b.id === cleanBookName.toUpperCase()
    );

    if (!book) return null;

    return {
        bookId: book.id,
        chapter,
        verse
    };
}
