import fs from 'fs';
import path from 'path';

// Map of full book names to OSIS/Standard 3-letter codes
const BOOK_MAP = {
    'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
    'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
    '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR',
    'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalm': 'PSA', 'Psalms': 'PSA', 'Proverbs': 'PRO',
    'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
    'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOL',
    'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM',
    'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
    'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
    'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
    'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
    '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT',
    'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
    '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
};

const inputFile = process.argv[2] || 'BSB.txt';
const outputFile = 'bsb_data.json';

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File '${inputFile}' not found.`);
    console.log(`Usage: node scripts/process_bsb.js <path-to-text-file>`);
    process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split(/\r?\n/);

const bible = {
    version: 'BSB',
    name: 'Berean Study Bible',
    books: {}
};

// Regex to parse "Book Chapter:Verse Text"
// Handles "1 John 1:1 Text" or "Genesis 1:1 Text"
// Capture groups: 1=Book, 2=Chapter, 3=Verse, 4=Text
const lineRegex = /^(.+?)\s+(\d+):(\d+)\s+(.+)$/;

let currentBook = null;
let currentChapter = null;

console.log(`Parsing ${lines.length} lines...`);

let verseCount = 0;

lines.forEach((line, index) => {
    if (!line.trim()) return;

    const match = line.match(lineRegex);
    if (!match) {
        // console.warn(`Line ${index + 1} did not match format: "${line}"`);
        return;
    }

    const [, bookName, chapterNum, verseNum, text] = match;
    const bookId = BOOK_MAP[bookName.trim()];

    if (!bookId) {
        console.warn(`Unknown book name: "${bookName}" on line ${index + 1}`);
        return;
    }

    // Initialize Book
    if (!bible.books[bookId]) {
        bible.books[bookId] = {
            id: bookId,
            name: bookName.trim(),
            chapters: {}
        };
    }

    // Initialize Chapter
    if (!bible.books[bookId].chapters[chapterNum]) {
        bible.books[bookId].chapters[chapterNum] = {
            number: parseInt(chapterNum),
            verses: []
        };
    }

    // Add Verse
    bible.books[bookId].chapters[chapterNum].verses.push({
        verse: parseInt(verseNum),
        text: text.trim()
    });

    verseCount++;
});

const finalOutput = {
    version: 'BSB',
    count: verseCount,
    books: Object.values(bible.books).map(book => ({
        ...book,
        order: Object.keys(BOOK_MAP).indexOf(book.name) + 1, // Simple order based on map keys
        chapters: Object.values(book.chapters).sort((a, b) => a.number - b.number)
    })).sort((a, b) => a.order - b.order)
};

fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2));

console.log(`Successfully parsed ${verseCount} verses.`);
console.log(`Output written to ${outputFile}`);

// Audio Tool Compatibility: Output flat list
const flatVerses = [];
Object.values(bible.books).forEach(book => {
    Object.values(book.chapters).forEach(chapter => {
        chapter.verses.forEach(v => {
            flatVerses.push({
                book: book.name,
                chapter: chapter.number,
                verse: v.verse,
                text: v.text
            });
        });
    });
});

const audioDataDir = path.resolve('data/bible');
if (!fs.existsSync(audioDataDir)) {
    fs.mkdirSync(audioDataDir, { recursive: true });
}
const flatOutputPath = path.join(audioDataDir, 'BSB.json');
fs.writeFileSync(flatOutputPath, JSON.stringify(flatVerses, null, 2));
console.log(`[Audio Tool] Flat dataset written to ${flatOutputPath}`);
