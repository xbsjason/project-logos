import { create, insertMultiple, search, type Results } from '@orama/orama';
import { persist, restore } from '@orama/plugin-data-persistence';

const DB_NAME = 'faithvoice-bible-index';

export interface BibleVerse {
    id: string; // GEN-1-1
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
}

interface SearchResult {
    message: string;
    citations: Array<{
        ref: string;
        text: string;
        bookId: string;
        chapter: number;
        verse: number;
    }>;
}

class BibleSearchService {
    private db: any = null; // Use any to avoid strict Orama type mismatches
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('BibleSearchService: Initializing...');
                // Try to restore from IndexedDB
                // @ts-ignore
                try {
                    const restored = await restore('json', DB_NAME);
                    if (restored) {
                        this.db = restored;
                        console.log('Bible index restored from IndexedDB');
                        this.initialized = true;
                        return;
                    }
                } catch (e) {
                    console.log('No existing index found or restore failed', e);
                }

                // Create new index
                console.log('Creating new Bible index...');
                this.db = await create({
                    schema: {
                        id: 'string',
                        bookId: 'string',
                        bookName: 'string',
                        chapter: 'number',
                        verse: 'number',
                        text: 'string',
                    },
                });

                // Fetch and index data
                console.log('Fetching Bible data...');
                const response = await fetch('/bsb_data.json');
                if (!response.ok) throw new Error(`Failed to fetch Bible data: ${response.statusText}`);

                const data = await response.json();
                console.log('Bible data loaded, indexing...');

                const verses: BibleVerse[] = [];

                // Flatten structure: Book -> Chapter -> Verse
                data.books.forEach((book: any) => {
                    book.chapters.forEach((chapter: any) => {
                        chapter.verses.forEach((verse: any) => {
                            verses.push({
                                id: `${book.id}-${chapter.number}-${verse.verse}`,
                                bookId: book.id,
                                bookName: book.name,
                                chapter: chapter.number,
                                verse: verse.verse,
                                text: verse.text
                            });
                        });
                    });
                });

                await insertMultiple(this.db, verses);
                console.log(`Indexed ${verses.length} verses.`);

                // Persist to IndexedDB
                // @ts-ignore
                await persist(this.db, 'json', DB_NAME);
                console.log('Bible index persisted to IndexedDB');

                this.initialized = true;
            } catch (err: any) {
                console.error('CRITICAL: Failed to initialize Bible search:', err);
                // Ensure we don't crash the app, but search won't work.
                this.initialized = false;
                this.db = null;
            }
        })();

        return this.initPromise;
    }

    private detectIntent(query: string): { type: 'greeting' | 'emotion' | 'topic' | 'unknown'; sentiment?: 'negative' | 'positive' | 'neutral'; keywords: string[] } {
        const lower = query.toLowerCase();

        // 1. Check Greetings
        if (/^(hi|hello|hey|greetings|selah)\b/.test(lower)) {
            return { type: 'greeting', sentiment: 'neutral', keywords: [] };
        }

        // 2. Check Emotions (Simple Keyword Matching)
        const negativeEmotions = ['sad', 'anxious', 'worried', 'depressed', 'lonely', 'afraid', 'fear', 'angry', 'broken', 'tired', 'struggling'];
        const positiveEmotions = ['happy', 'joy', 'thankful', 'blessed', 'excited', 'peace', 'grateful', 'love'];

        const foundNegative = negativeEmotions.filter(e => lower.includes(e));
        if (foundNegative.length > 0) {
            return { type: 'emotion', sentiment: 'negative', keywords: foundNegative };
        }

        const foundPositive = positiveEmotions.filter(e => lower.includes(e));
        if (foundPositive.length > 0) {
            return { type: 'emotion', sentiment: 'positive', keywords: foundPositive };
        }

        return { type: 'topic', sentiment: 'neutral', keywords: [] };
    }

    async search(query: string, limit = 5): Promise<SearchResult> {
        try {
            if (!this.initialized || !this.db) {
                await this.init();
            }

            if (!this.db || !this.initialized) {
                return {
                    message: "I'm sorry, I'm currently unable to access the Bible database. Please refresh the page and try again.",
                    citations: []
                };
            }

            // NLP Processing
            const intent = this.detectIntent(query);

            if (intent.type === 'greeting') {
                return {
                    message: "Grace and peace to you! I am here to help you find wisdom in God's Word. What is on your heart today?",
                    citations: []
                };
            }

            const results: Results<BibleVerse> = await search(this.db, {
                term: query,
                limit: limit,
                threshold: 0.2,
            });

            if (results.count === 0) {
                return {
                    message: "I couldn't find specific verses matching that exactly. You might try rephrasing, or tell me how you're feeling.",
                    citations: []
                };
            }

            const citations = results.hits.map(hit => ({
                ref: `${hit.document.bookName} ${hit.document.chapter}:${hit.document.verse}`,
                text: hit.document.text,
                bookId: hit.document.bookId,
                chapter: hit.document.chapter as number,
                verse: hit.document.verse as number
            }));

            // Dynamic Response generation based on Intent/Sentiment
            let intro = `Here are some verses about "${query}":`;

            if (intent.sentiment === 'negative') {
                const comfortIntros = [
                    `I'm sorry you're feeling this way. Here is what God's Word says to comfort you:`,
                    `In times of trouble, scripture offers us peace. Consider these verses:`,
                    `Lay your burdens on the Lord. I found these passages for you:`,
                    `You are not alone. Let these promises from scripture encourage your heart:`
                ];
                intro = comfortIntros[Math.floor(Math.random() * comfortIntros.length)];
            } else if (intent.sentiment === 'positive') {
                const joyIntros = [
                    `It is wonderful to rejoice in the Lord! Here are verses that share your joy:`,
                    `Praise God! I found these scriptures that echo your heart:`,
                    `Let's celebrate God's goodness with these passages:`,
                    `A joyful heart is good medicine. Here is what the Bible says:`
                ];
                intro = joyIntros[Math.floor(Math.random() * joyIntros.length)];
            } else {
                const neutralIntros = [
                    `Here are some scriptures that speak to "${query}":`,
                    `I found these verses that might offer guidance on "${query}":`,
                    `Let's look at what God's Word says about "${query}":`,
                    `These passages came to mind regarding "${query}":`
                ];
                intro = neutralIntros[Math.floor(Math.random() * neutralIntros.length)];
            }

            return {
                message: intro,
                citations
            };
        } catch (error) {
            console.error('Search error:', error);
            return {
                message: "An error occurred while searching. Please try again.",
                citations: []
            };
        }
    }
}

export const bibleSearchService = new BibleSearchService();
