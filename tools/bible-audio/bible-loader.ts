import fs from 'fs';
import path from 'path';
import { Verse } from './types.js';
import { validateVerse } from './validate.js';

export async function loadBibleData(filePath: string): Promise<Verse[]> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Bible data file not found at: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let verses: Verse[] = [];

    if (ext === '.json') {
        const content = fs.readFileSync(filePath, 'utf-8');
        verses = JSON.parse(content);
    } else if (ext === '.jsonl') {
        const content = fs.readFileSync(filePath, 'utf-8');
        verses = content.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
                const raw = JSON.parse(line);
                return {
                    book: raw.bookName || raw.book,
                    chapter: raw.chapter,
                    verse: raw.verse,
                    text: raw.text
                };
            });
    } else if (ext === '.csv') {
        // Simple CSV parser implementation if needed later, but focusing on JSON for now as per plan focus
        throw new Error("CSV support not yet fully implemented. Please use JSON.");
    } else {
        throw new Error(`Unsupported file extension: ${ext}`);
    }

    // Validate all loaded verses
    verses.forEach(validateVerse);

    return verses;
}
