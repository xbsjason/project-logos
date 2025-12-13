export type VerseRecord = {
    version: "KJV" | "WEB" | "ASV" | "DRA";
    testament: "OT" | "NT";
    bookId: string;                              // stable canonical id (ex: "gen", "mat")
    bookName: string;                            // display name (ex: "Genesis")
    chapter: number;
    verse: number;
    reference: string;                           // "Genesis 1:1"
    text: string;                                // verse text
    key: string;                                 // `${version}:${bookId}:${chapter}:${verse}`
    createdAt?: number;                          // optional epoch ms
};
