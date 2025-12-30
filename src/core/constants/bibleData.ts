import type { BibleBook } from '../types/bible';

// Standard Protestant Canon (66 Books)
export const PROTESTANT_BOOKS: BibleBook[] = [
    // OT
    { id: 'GEN', name: 'Genesis', order: 1, chapterCount: 50, testament: 'OT' },
    { id: 'EXO', name: 'Exodus', order: 2, chapterCount: 40, testament: 'OT' },
    { id: 'LEV', name: 'Leviticus', order: 3, chapterCount: 27, testament: 'OT' },
    { id: 'NUM', name: 'Numbers', order: 4, chapterCount: 36, testament: 'OT' },
    { id: 'DEU', name: 'Deuteronomy', order: 5, chapterCount: 34, testament: 'OT' },
    { id: 'JOS', name: 'Joshua', order: 6, chapterCount: 24, testament: 'OT' },
    { id: 'JDG', name: 'Judges', order: 7, chapterCount: 21, testament: 'OT' },
    { id: 'RUT', name: 'Ruth', order: 8, chapterCount: 4, testament: 'OT' },
    { id: '1SA', name: '1 Samuel', order: 9, chapterCount: 31, testament: 'OT' },
    { id: '2SA', name: '2 Samuel', order: 10, chapterCount: 24, testament: 'OT' },
    { id: '1KI', name: '1 Kings', order: 11, chapterCount: 22, testament: 'OT' },
    { id: '2KI', name: '2 Kings', order: 12, chapterCount: 25, testament: 'OT' },
    { id: '1CH', name: '1 Chronicles', order: 13, chapterCount: 29, testament: 'OT' },
    { id: '2CH', name: '2 Chronicles', order: 14, chapterCount: 36, testament: 'OT' },
    { id: 'EZR', name: 'Ezra', order: 15, chapterCount: 10, testament: 'OT' },
    { id: 'NEH', name: 'Nehemiah', order: 16, chapterCount: 13, testament: 'OT' },
    { id: 'EST', name: 'Esther', order: 17, chapterCount: 10, testament: 'OT' },
    { id: 'JOB', name: 'Job', order: 18, chapterCount: 42, testament: 'OT' },
    { id: 'PSA', name: 'Psalms', order: 19, chapterCount: 150, testament: 'OT' },
    { id: 'PRO', name: 'Proverbs', order: 20, chapterCount: 31, testament: 'OT' },
    { id: 'ECC', name: 'Ecclesiastes', order: 21, chapterCount: 12, testament: 'OT' },
    { id: 'SNG', name: 'Song of Solomon', order: 22, chapterCount: 8, testament: 'OT' },
    { id: 'ISA', name: 'Isaiah', order: 23, chapterCount: 66, testament: 'OT' },
    { id: 'JER', name: 'Jeremiah', order: 24, chapterCount: 52, testament: 'OT' },
    { id: 'LAM', name: 'Lamentations', order: 25, chapterCount: 5, testament: 'OT' },
    { id: 'EZK', name: 'Ezekiel', order: 26, chapterCount: 48, testament: 'OT' },
    { id: 'DAN', name: 'Daniel', order: 27, chapterCount: 12, testament: 'OT' },
    { id: 'HOS', name: 'Hosea', order: 28, chapterCount: 14, testament: 'OT' },
    { id: 'JOL', name: 'Joel', order: 29, chapterCount: 3, testament: 'OT' },
    { id: 'AMO', name: 'Amos', order: 30, chapterCount: 9, testament: 'OT' },
    { id: 'OBA', name: 'Obadiah', order: 31, chapterCount: 1, testament: 'OT' },
    { id: 'JON', name: 'Jonah', order: 32, chapterCount: 4, testament: 'OT' },
    { id: 'MIC', name: 'Micah', order: 33, chapterCount: 7, testament: 'OT' },
    { id: 'NAM', name: 'Nahum', order: 34, chapterCount: 3, testament: 'OT' },
    { id: 'HAB', name: 'Habakkuk', order: 35, chapterCount: 3, testament: 'OT' },
    { id: 'ZEP', name: 'Zephaniah', order: 36, chapterCount: 3, testament: 'OT' },
    { id: 'HAG', name: 'Haggai', order: 37, chapterCount: 2, testament: 'OT' },
    { id: 'ZEC', name: 'Zechariah', order: 38, chapterCount: 14, testament: 'OT' },
    { id: 'MAL', name: 'Malachi', order: 39, chapterCount: 4, testament: 'OT' },
    // NT
    { id: 'MAT', name: 'Matthew', order: 40, chapterCount: 28, testament: 'NT' },
    { id: 'MRK', name: 'Mark', order: 41, chapterCount: 16, testament: 'NT' },
    { id: 'LUK', name: 'Luke', order: 42, chapterCount: 24, testament: 'NT' },
    { id: 'JHN', name: 'John', order: 43, chapterCount: 21, testament: 'NT' },
    { id: 'ACT', name: 'Acts', order: 44, chapterCount: 28, testament: 'NT' },
    { id: 'ROM', name: 'Romans', order: 45, chapterCount: 16, testament: 'NT' },
    { id: '1CO', name: '1 Corinthians', order: 46, chapterCount: 16, testament: 'NT' },
    { id: '2CO', name: '2 Corinthians', order: 47, chapterCount: 13, testament: 'NT' },
    { id: 'GAL', name: 'Galatians', order: 48, chapterCount: 6, testament: 'NT' },
    { id: 'EPH', name: 'Ephesians', order: 49, chapterCount: 6, testament: 'NT' },
    { id: 'PHP', name: 'Philippians', order: 50, chapterCount: 4, testament: 'NT' },
    { id: 'COL', name: 'Colossians', order: 51, chapterCount: 4, testament: 'NT' },
    { id: '1TH', name: '1 Thessalonians', order: 52, chapterCount: 5, testament: 'NT' },
    { id: '2TH', name: '2 Thessalonians', order: 53, chapterCount: 3, testament: 'NT' },
    { id: '1TI', name: '1 Timothy', order: 54, chapterCount: 6, testament: 'NT' },
    { id: '2TI', name: '2 Timothy', order: 55, chapterCount: 4, testament: 'NT' },
    { id: 'TIT', name: 'Titus', order: 56, chapterCount: 3, testament: 'NT' },
    { id: 'PHM', name: 'Philemon', order: 57, chapterCount: 1, testament: 'NT' },
    { id: 'HEB', name: 'Hebrews', order: 58, chapterCount: 13, testament: 'NT' },
    { id: 'JAS', name: 'James', order: 59, chapterCount: 5, testament: 'NT' },
    { id: '1PE', name: '1 Peter', order: 60, chapterCount: 5, testament: 'NT' },
    { id: '2PE', name: '2 Peter', order: 61, chapterCount: 3, testament: 'NT' },
    { id: '1JN', name: '1 John', order: 62, chapterCount: 5, testament: 'NT' },
    { id: '2JN', name: '2 John', order: 63, chapterCount: 1, testament: 'NT' },
    { id: '3JN', name: '3 John', order: 64, chapterCount: 1, testament: 'NT' },
    { id: 'JUD', name: 'Jude', order: 65, chapterCount: 1, testament: 'NT' },
    { id: 'REV', name: 'Revelation', order: 66, chapterCount: 22, testament: 'NT' },
];

export const BIBLE_BOOKS = PROTESTANT_BOOKS; // Default export for backwards compatibility if needed

// Catholic Canon (Douay-Rheims Order)
export const CATHOLIC_BOOKS: BibleBook[] = [
    { id: 'GEN', name: 'Genesis', order: 1, chapterCount: 50, testament: 'OT' },
    { id: 'EXO', name: 'Exodus', order: 2, chapterCount: 40, testament: 'OT' },
    { id: 'LEV', name: 'Leviticus', order: 3, chapterCount: 27, testament: 'OT' },
    { id: 'NUM', name: 'Numbers', order: 4, chapterCount: 36, testament: 'OT' },
    { id: 'DEU', name: 'Deuteronomy', order: 5, chapterCount: 34, testament: 'OT' },
    { id: 'JOS', name: 'Joshua', order: 6, chapterCount: 24, testament: 'OT' },
    { id: 'JDG', name: 'Judges', order: 7, chapterCount: 21, testament: 'OT' },
    { id: 'RUT', name: 'Ruth', order: 8, chapterCount: 4, testament: 'OT' },
    { id: '1SA', name: '1 Samuel', order: 9, chapterCount: 31, testament: 'OT' },
    { id: '2SA', name: '2 Samuel', order: 10, chapterCount: 24, testament: 'OT' },
    { id: '1KI', name: '1 Kings', order: 11, chapterCount: 22, testament: 'OT' },
    { id: '2KI', name: '2 Kings', order: 12, chapterCount: 25, testament: 'OT' },
    { id: '1CH', name: '1 Chronicles', order: 13, chapterCount: 29, testament: 'OT' },
    { id: '2CH', name: '2 Chronicles', order: 14, chapterCount: 36, testament: 'OT' },
    { id: 'EZR', name: 'Ezra', order: 15, chapterCount: 10, testament: 'OT' },
    { id: 'NEH', name: 'Nehemiah', order: 16, chapterCount: 13, testament: 'OT' },
    { id: 'TOB', name: 'Tobit', order: 17, chapterCount: 14, testament: 'OT' },
    { id: 'JDT', name: 'Judith', order: 18, chapterCount: 16, testament: 'OT' },
    { id: 'EST', name: 'Esther', order: 19, chapterCount: 16, testament: 'OT' }, // Ext
    { id: 'JOB', name: 'Job', order: 20, chapterCount: 42, testament: 'OT' },
    { id: 'PSA', name: 'Psalms', order: 21, chapterCount: 150, testament: 'OT' },
    { id: 'PRO', name: 'Proverbs', order: 22, chapterCount: 31, testament: 'OT' },
    { id: 'ECC', name: 'Ecclesiastes', order: 23, chapterCount: 12, testament: 'OT' },
    { id: 'SNG', name: 'Song of Solomon', order: 24, chapterCount: 8, testament: 'OT' },
    { id: 'WIS', name: 'Wisdom', order: 25, chapterCount: 19, testament: 'OT' },
    { id: 'SIR', name: 'Sirach', order: 26, chapterCount: 51, testament: 'OT' },
    { id: 'ISA', name: 'Isaiah', order: 27, chapterCount: 66, testament: 'OT' },
    { id: 'JER', name: 'Jeremiah', order: 28, chapterCount: 52, testament: 'OT' },
    { id: 'LAM', name: 'Lamentations', order: 29, chapterCount: 5, testament: 'OT' },
    { id: 'BAR', name: 'Baruch', order: 30, chapterCount: 6, testament: 'OT' },
    { id: 'EZK', name: 'Ezekiel', order: 31, chapterCount: 48, testament: 'OT' },
    { id: 'DAN', name: 'Daniel', order: 32, chapterCount: 14, testament: 'OT' }, // Ext
    { id: 'HOS', name: 'Hosea', order: 33, chapterCount: 14, testament: 'OT' },
    { id: 'JOL', name: 'Joel', order: 34, chapterCount: 3, testament: 'OT' },
    { id: 'AMO', name: 'Amos', order: 35, chapterCount: 9, testament: 'OT' },
    { id: 'OBA', name: 'Obadiah', order: 36, chapterCount: 1, testament: 'OT' },
    { id: 'JON', name: 'Jonah', order: 37, chapterCount: 4, testament: 'OT' },
    { id: 'MIC', name: 'Micah', order: 38, chapterCount: 7, testament: 'OT' },
    { id: 'NAM', name: 'Nahum', order: 39, chapterCount: 3, testament: 'OT' },
    { id: 'HAB', name: 'Habakkuk', order: 40, chapterCount: 3, testament: 'OT' },
    { id: 'ZEP', name: 'Zephaniah', order: 41, chapterCount: 3, testament: 'OT' },
    { id: 'HAG', name: 'Haggai', order: 42, chapterCount: 2, testament: 'OT' },
    { id: 'ZEC', name: 'Zechariah', order: 43, chapterCount: 14, testament: 'OT' },
    { id: 'MAL', name: 'Malachi', order: 44, chapterCount: 4, testament: 'OT' },
    { id: '1MA', name: '1 Maccabees', order: 45, chapterCount: 16, testament: 'OT' },
    { id: '2MA', name: '2 Maccabees', order: 46, chapterCount: 15, testament: 'OT' },
    // NT (starts at 47 now)
    ...PROTESTANT_BOOKS.filter(b => b.testament === 'NT').map((b, i) => ({ ...b, order: 47 + i }))
];

export function getBooksForVersion(version: string): BibleBook[] {
    if (version === 'DRA') {
        return CATHOLIC_BOOKS;
    }
    // Default to Protestant 66 for BSB, KJV, WEB, ASV
    // Note: WEB/KJV have Apocrypha versions but 'WEB' usually implies Protestant (or has separate 'WEB-BE'). 
    // We'll stick to 66 for KJV/WEB/ASV unless User requests otherwise.
    return PROTESTANT_BOOKS;
}
