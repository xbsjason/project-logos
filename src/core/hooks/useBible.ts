import { useState, useEffect } from 'react';
import { useBibleContext } from '../state/BibleContext';
import { getBooksForVersion } from '../constants/bibleData';
import { BibleService } from '../services/BibleService';
import type { BibleChapter } from '../services/BibleService';

export function useBooks() {
    const { version } = useBibleContext();
    const books = getBooksForVersion(version);

    return {
        books,
        loading: false,
        error: null
    };
}

export function useChapter(version: string, bookId: string | undefined, chapter: number) {
    const [data, setData] = useState<BibleChapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!bookId) return;

        async function loadChapter() {
            setLoading(true);
            try {
                const chapterData = await BibleService.getChapter(version, bookId!, chapter);
                setData(chapterData);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }
        loadChapter();
    }, [version, bookId, chapter]);

    return { data, loading, error };
}
