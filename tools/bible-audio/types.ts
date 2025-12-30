export interface AudioConfig {
    ttsBaseUrl: string;
    voiceId: string;
    speakingRate: number;
    pitch: number;
    volume: number;
    pauseMsAfterVerse: number;
    format: 'mp3' | 'wav';
    sampleRate: number;
    translation: string;
    outputRoot: string;
    mode: 'verse' | 'chapter';
    force: boolean;
    dryRun: boolean;
    concurrency: number;
    retryCount: number;
    maxCharsPerChunk: number;
    audioExtension: string;
    book?: string;
    chapter?: number;
}

export interface Verse {
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface VerseMetadata {
    text: string;
    duration?: number;
    next?: string;
    previous?: string;
}

export interface ChapterManifest {
    translation: string;
    book: string;
    chapter: number;
    verses: number;
    files: string[];
}

export interface GlobalManifest {
    translation: string;
    generatedAt: string;
    books: {
        [book: string]: {
            chapters: number[];
        };
    };
}
