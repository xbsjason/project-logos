import fs from 'fs';
import path from 'path';
import { GlobalManifest } from './types.js';

export function generateManifest(outputRoot: string, translation: string): void {
    const manifestPath = path.join(outputRoot, translation, 'index.json');
    const translationDir = path.join(outputRoot, translation);

    if (!fs.existsSync(translationDir)) {
        console.warn(`Translation directory not found: ${translationDir}`);
        return;
    }

    const books = fs.readdirSync(translationDir).filter(name => fs.statSync(path.join(translationDir, name)).isDirectory());
    const manifest: GlobalManifest = {
        translation,
        generatedAt: new Date().toISOString(),
        books: {}
    };

    for (const book of books) {
        const bookDir = path.join(translationDir, book);
        const chapters = fs.readdirSync(bookDir)
            .filter(name => fs.statSync(path.join(bookDir, name)).isDirectory())
            .map(name => parseInt(name, 10))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);

        if (chapters.length > 0) {
            manifest.books[book] = {
                chapters: chapters
            };
        }
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated at: ${manifestPath}`);
}
