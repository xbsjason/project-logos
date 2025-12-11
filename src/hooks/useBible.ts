import { useState, useEffect } from 'react';
import { BibleService } from '../services/BibleService';
import type { BibleBook, BibleChapter } from '../services/BibleService';

export function useBooks() {
    const [books, setBooks] = useState<BibleBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function loadBooks() {
            try {
                const data = await BibleService.getBooks();
                setBooks(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }
        loadBooks();
    }, []);

    return { books, loading, error };
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
