
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';
import { VerseRecord } from './schema';
import { BOOK_MAP, getCanon } from './canon';

interface ParserOptions {
    version: "KJV" | "WEB" | "ASV" | "DRA";
    mode?: "protestant66" | "catholic73";
}

export async function parseUsfmFiles(
    files: string[],
    opts: ParserOptions,
    onVerse: (v: VerseRecord) => Promise<void>
) {
    const canon = getCanon(opts.mode || "protestant66");
    const canonIds = new Set(canon.map(b => b.id));

    for (const file of files) {
        const stats = await parseFile(file, opts.version, canonIds, onVerse);
        // We could aggregate stats here
    }
}

async function parseFile(
    filepath: string,
    version: "KJV" | "WEB" | "ASV" | "DRA",
    validBookIds: Set<string>,
    onVerse: (v: VerseRecord) => Promise<void>
) {
    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentBookId: string | null = null;
    let currentChapter: number = 0;

    // We might have multi-line verses, though USFM usually puts \v on new lines.
    // However, text can wrap.
    // Strategy: 
    // Maintain a "current verse" buffer. When we hit a new \v or \c or \id, flush the previous one.

    let pendingVerse: Partial<VerseRecord> | null = null;

    const flushVerse = async () => {
        if (pendingVerse && pendingVerse.text) {
            // Clean text
            const cleaned = cleanText(pendingVerse.text);
            if (cleaned.trim().length > 0) {
                // Finalize
                const fullVerse: VerseRecord = {
                    version: version,
                    testament: getTestament(pendingVerse.bookId!),
                    bookId: pendingVerse.bookId!,
                    bookName: BOOK_MAP.get(pendingVerse.bookId!)?.name || pendingVerse.bookId!,
                    chapter: pendingVerse.chapter!,
                    verse: pendingVerse.verse!,
                    reference: `${BOOK_MAP.get(pendingVerse.bookId!)?.name || pendingVerse.bookId} ${pendingVerse.chapter}:${pendingVerse.verse}`,
                    text: cleaned,
                    key: `${version}:${pendingVerse.bookId}:${pendingVerse.chapter}:${pendingVerse.verse}`,
                    createdAt: Date.now()
                };
                await onVerse(fullVerse);
            }
        }
        pendingVerse = null;
    };

    for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for markers
        // \id GEN ...
        // \c 1
        // \v 1 ...

        if (trimmed.startsWith('\\id ')) {
            await flushVerse();
            // \id CODE optional description
            const parts = trimmed.split(' ');
            const rawId = parts[1].toLowerCase(); // 'gen'
            // Map to our canonical ID
            const def = BOOK_MAP.get(rawId);
            if (def && validBookIds.has(def.id)) {
                currentBookId = def.id;
            } else {
                currentBookId = null; // Ignore this book
            }
            currentChapter = 0;
            continue;
        }

        if (!currentBookId) continue; // Skip content if not in a valid book

        if (trimmed.startsWith('\\c ')) {
            await flushVerse();
            const parts = trimmed.split(' ');
            currentChapter = parseInt(parts[1], 10);
            continue;
        }

        if (trimmed.startsWith('\\v ')) {
            await flushVerse();
            // \v 1 Text goes here...
            // Be careful, sometimes "\v 1" is followed by text immediately, or on next line? Usually same line in USFM.
            // Format: \v NUMBER Text...
            const match = trimmed.match(/^\\v\s+(\d+)\s*(.*)/);
            if (match) {
                const verseNum = parseInt(match[1], 10);
                const text = match[2];
                pendingVerse = {
                    bookId: currentBookId,
                    chapter: currentChapter,
                    verse: verseNum,
                    text: text
                };
            }
            continue;
        }

        // If it starts with other tags like \p, \q, just treat as text or ignore?
        // Standard USFM: \p is paragraph start. We probably want to append the text if we are inside a verse.
        // But if we are between verses? USFM text is usually "verse text", markers like \p just format it.
        // HOWEVER, we need to strip the '\p' marker itself.
        // And we need to strip footnotes \f ... \f*

        if (pendingVerse) {
            // Append line to current verse.
            // But handle markers.
            // If line is just "\p", ignore it? 
            // Often "\p" is on its own line.
            // If line starts with a backslash and is NOT a known structure marker (c, v, id)
            // convert it to space or ignore?

            // Allow text continuation.
            // Remove known paragraph/formatting markers at start: \p, \q, \m, \nb, \li...
            // Simplistic approach: if line starts with \, check if it is a "text content" line or "structure" line.
            // \p is structure for paragraph, but doesn't interrupt verse text usually? Actually it does.
            // "Bible text flows through chapters and verses, and also through paragraphs."
            // So if we see \p inside a verse, it's just a paragraph break. The text continues.
            // We'll treat it as a space.

            // Regex to match "^\\[a-z0-9]+\s?"
            let cleanLine = trimmed;
            if (cleanLine.startsWith('\\')) {
                // Remove the tag at the start
                cleanLine = cleanLine.replace(/^\\\w+\s?/, '');
            }

            if (cleanLine) {
                pendingVerse.text += " " + cleanLine;
            }
        }
    }

    await flushVerse();
    return true;
}

function getTestament(bookId: string): "OT" | "NT" {
    const def = BOOK_MAP.get(bookId);
    return def ? def.testament : "OT";
}

function cleanText(text: string): string {
    // 1. Remove footnotes: \f ... \f*
    let t = text.replace(/\\f\s.*?\\f\*/g, '');
    // 2. Remove cross refs: \x ... \x*
    t = t.replace(/\\x\s.*?\\x\*/g, '');
    // 3. Remove other tags like \wj ... \wj* (words of Jesus - keep text, remove tags)
    // Actually, simple regex to remove any \tag and \tag*?
    // Be careful. \wj text \wj* -> we want "text".
    // Strategy: Remove the TAGS but keep CONTENT, EXCEPT for footnotes/xrefs where we remove CONTENT too.

    // We already removed f and x content.
    // Now remove remaining tags: `\add`, `\add*`, `\wj`, `\wj*`, `\qs`...
    // Regex: Backslash + alphanumeric + optional * + optional space?
    // We want to KEEP the spaces between words.
    // Example: "\wj Jesus said\wj* hello" -> "Jesus said hello"

    // Remove tags simple: `\\[a-z0-9]+\*?` ?
    // But verify we don't eat text. Tags are usually adjacent to text.

    // Some tags have attributes? USFM tags are usually simple `\tag`.
    // Valid approach: Remove `\w+` markers? 
    // Careful with `\s` (non-breaking space).
    // Let's iterate or use a package?
    // `usfm-parser` package might be better but I am writing custom one.
    // Let's just strip `\\[A-Za-z0-9]+` and `\\[A-Za-z0-9]+\*`.

    // But we must NOT strip the text *following* the tag.
    // Example: "\wj words\wj*"
    // "\wj " matches. Replace with "". 
    // "\wj*" matches. Replace with "".

    // Do it in a loop or global replace.

    t = t.replace(/\\[A-Za-z0-9+]+\*?/g, '');

    // Remove word attributes like |strong="H1234"
    t = t.replace(/\|[a-z]+="[^"]*"/g, '');

    // Remove pilcrow and other symbols
    t = t.replace(/[¶‡†¦]/g, '');

    // Clean up spaces
    t = t.replace(/\s+/g, ' ').trim();
    return t;
}
