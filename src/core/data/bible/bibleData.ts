export interface BibleVerse {
    id: string; // bsb_JHN_3_16
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface BibleBook {
    id: string; // JHN
    name: string;
    chapters: number;
}

// Minimal subset for demonstration
export const BIBLE_BOOKS: BibleBook[] = [
    { id: 'GEN', name: 'Genesis', chapters: 50 },
    { id: 'PSA', name: 'Psalms', chapters: 150 },
    { id: 'MAT', name: 'Matthew', chapters: 28 },
    { id: 'JHN', name: 'John', chapters: 21 },
    { id: 'ROM', name: 'Romans', chapters: 16 },
];

export const MOCK_VERSES: BibleVerse[] = [
    { id: 'bsb_JHN_1_1', book: 'John', chapter: 1, verse: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
    { id: 'bsb_JHN_1_2', book: 'John', chapter: 1, verse: 2, text: 'He was with God in the beginning.' },
    { id: 'bsb_JHN_1_3', book: 'John', chapter: 1, verse: 3, text: 'Through Him all things were made, and without Him nothing was made that has been made.' },
    { id: 'bsb_JHN_1_4', book: 'John', chapter: 1, verse: 4, text: 'In Him was life, and that life was the light of men.' },
    { id: 'bsb_JHN_1_5', book: 'John', chapter: 1, verse: 5, text: 'The Light shines in the darkness, and the darkness has not overcome it.' },
    { id: 'bsb_JHN_3_16', book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him shall not perish but have eternal life.' },
];

export function getBook(bookId: string) {
    return BIBLE_BOOKS.find(b => b.id === bookId);
}

export function getChapterVerses(bookId: string, chapter: number) {
    // Return mocks or generate filler for demo
    const specificVerses = MOCK_VERSES.filter(v => v.id.includes(`bsb_${bookId}_${chapter}_`));

    if (specificVerses.length > 0) return specificVerses;

    // Generate generic verses if no mock data exists for this chapter
    return Array.from({ length: 10 }, (_, i) => ({
        id: `bsb_${bookId}_${chapter}_${i + 1}`,
        book: bookId,
        chapter,
        verse: i + 1,
        text: `[Placeholder text for ${bookId} ${chapter}:${i + 1}] This is a demonstration verse to show the reader layout and scrolling behavior.`
    }));
}
