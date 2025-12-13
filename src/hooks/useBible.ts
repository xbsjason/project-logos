import { useState, useEffect } from 'react';
import { BibleService } from '../services/BibleService';
import type { BibleChapter } from '../services/BibleService';

import { BIBLE_BOOKS } from '../constants/bibleData';

export function useBooks() {
    // Return hardcoded books instantly
    return {
        books: BIBLE_BOOKS,
        loading: false,
        error: null
    };
}

export function useChapter(bookId: string | undefined, chapter: number) {
    const [data, setData] = useState<BibleChapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!bookId) return;

        async function loadChapter() {
            setLoading(true);
            try {
                const chapterData = await BibleService.getChapter(bookId!, chapter);
                setData(chapterData);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }
        loadChapter();
    }, [bookId, chapter]);

    return { data, loading, error };
}
