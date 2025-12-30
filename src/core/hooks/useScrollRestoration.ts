import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollRestoration
 * 
 * Standardized hook to save and restore scroll position for a target element.
 * 
 * @param elementRef - React ref for the scrollable container
 * @param keySuffix - Optional key to distinguish between same-route states (e.g. tabs)
 * @param isActive - Optional flag to enable/disable (useful for loading states)
 */
export function useScrollRestoration(
    elementRef: React.RefObject<HTMLElement | null>,
    keySuffix: string = '',
    isActive: boolean = true
) {
    const location = useLocation();
    const scrollKey = `scroll_${location.pathname}${keySuffix}`;
    const restoreAttempted = useRef(false);

    // Save scroll position
    const saveScroll = useCallback(() => {
        if (!elementRef.current || !isActive) return;
        const currentScroll = elementRef.current.scrollTop;
        if (currentScroll > 0) {
            sessionStorage.setItem(scrollKey, currentScroll.toString());
        }
    }, [elementRef, scrollKey, isActive]);

    // Restore scroll position
    const restoreScroll = useCallback(() => {
        if (!elementRef.current || !isActive) return;

        const savedPos = sessionStorage.getItem(scrollKey);
        if (savedPos) {
            const pos = parseInt(savedPos, 10);

            // Use multiple frames to ensure DOM layout is truly ready
            requestAnimationFrame(() => {
                if (elementRef.current) {
                    elementRef.current.scrollTop = pos;
                }
            });

            // Secondary backup for heavier pages
            setTimeout(() => {
                if (elementRef.current && elementRef.current.scrollTop !== pos) {
                    elementRef.current.scrollTop = pos;
                }
            }, 50);
        }

        restoreAttempted.current = true;
    }, [elementRef, scrollKey, isActive]);

    // Save before route change or unmount
    useEffect(() => {
        return () => {
            saveScroll();
        };
    }, [saveScroll]);

    // Restore on mount or when data becomes active
    useEffect(() => {
        if (isActive) {
            restoreScroll();
        }
    }, [isActive, restoreScroll]);

    return {
        saveScroll,
        restoreScroll
    };
}
