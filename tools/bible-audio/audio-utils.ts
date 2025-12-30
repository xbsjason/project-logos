import { AudioConfig } from './types.js';
import path from 'path';
import fs from 'fs';

export function getAudioPath(root: string, translation: string, book: string, chapter: number, verse: number, extension: string): string {
    const slug = book.toLowerCase().replace(/\s+/g, '_');
    return path.join(root, translation, slug, chapter.toString(), `${slug}_${chapter}_${verse}.${extension}`);
}

export function getMetadataPath(root: string, translation: string, book: string, chapter: number, verse: number): string {
    const slug = book.toLowerCase().replace(/\s+/g, '_');
    return path.join(root, translation, slug, chapter.toString(), `${slug}_${chapter}_${verse}.json`);
}

export function getChapterPath(root: string, translation: string, book: string, chapter: number): string {
    const slug = book.toLowerCase().replace(/\s+/g, '_');
    return path.join(root, translation, slug, chapter.toString());
}

export function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function normalizeText(text: string): string {
    return text.trim();
}

/**
 * Checks if generation should proceed based on existing files and force flag.
 */
export function shouldGenerate(audioPath: string, jsonPath: string, force: boolean): boolean {
    if (force) return true;
    if (!fs.existsSync(audioPath)) return true;
    if (!fs.existsSync(jsonPath)) return true;
    return false;
}
