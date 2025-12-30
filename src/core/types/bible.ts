export interface BibleBook {
    id: string;
    name: string;
    order: number;
    chapterCount: number;
    testament: 'OT' | 'NT';
}

export interface BibleVerse {
    verse: number;
    text: string;
}

export interface BibleChapter {
    number: number;
    verses: BibleVerse[];
}
