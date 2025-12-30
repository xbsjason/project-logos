import fs from 'fs';
import { AudioConfig, Verse } from './types.js';

export function validateConfig(config: AudioConfig): void {
    if (!config.ttsBaseUrl) throw new Error("Missing ttsBaseUrl in config");
    if (!config.voiceId) throw new Error("Missing voiceId in config");
    if (!config.translation) throw new Error("Missing translation in config");
    if (!config.outputRoot) throw new Error("Missing outputRoot in config");
}

export function validateVerse(verse: Verse): void {
    if (!verse.book) throw new Error(`Verse missing book: ${JSON.stringify(verse)}`);
    if (!verse.chapter) throw new Error(`Verse missing chapter: ${JSON.stringify(verse)}`);
    if (!verse.verse) throw new Error(`Verse missing verse number: ${JSON.stringify(verse)}`);
    if (!verse.text) throw new Error(`Verse missing text: ${JSON.stringify(verse)}`);
}
