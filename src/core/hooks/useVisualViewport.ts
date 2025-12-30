import { useState, useEffect } from 'react';

interface VisualViewportState {
    height: number;
    keyboardHeight: number;
    isKeyboardOpen: boolean;
}

/**
 * Custom hook for handling iOS keyboard behavior using Visual Viewport API.
 * 
 * On iOS, when the keyboard opens, the visual viewport shrinks but the layout viewport
 * stays the same. This hook calculates the difference and provides dynamic padding
 * to push content above the keyboard.
 * 
 * For Android with `interactive-widget=resizes-content` meta tag, this hook
 * still works but the padding will be minimal since Android already resizes the viewport.
 * 
 * Usage:
 * ```tsx
 * const { keyboardHeight, isKeyboardOpen } = useVisualViewport();
 * return <div style={{ paddingBottom: keyboardHeight }}>...</div>
 * ```
 */
export function useVisualViewport(): VisualViewportState {
    const [state, setState] = useState<VisualViewportState>({
        height: window.visualViewport?.height || window.innerHeight,
        keyboardHeight: 0,
        isKeyboardOpen: false
    });

    useEffect(() => {
        // Check if Visual Viewport API is supported (iOS Safari, modern browsers)
        if (!window.visualViewport) {
            console.warn('Visual Viewport API not supported');
            return;
        }

        const visualViewport = window.visualViewport;
        const initialHeight = window.innerHeight;

        const handleResize = () => {
            const currentHeight = visualViewport.height;
            const heightDiff = initialHeight - currentHeight;

            // Keyboard is considered "open" if viewport shrunk by more than 150px
            // (this threshold accounts for browser chrome changes)
            const isKeyboardOpen = heightDiff > 150;

            setState({
                height: currentHeight,
                keyboardHeight: isKeyboardOpen ? heightDiff : 0,
                isKeyboardOpen
            });
        };

        // Listen to resize and scroll events
        // Scroll events fire on iOS when keyboard opens/closes
        visualViewport.addEventListener('resize', handleResize);
        visualViewport.addEventListener('scroll', handleResize);

        return () => {
            visualViewport.removeEventListener('resize', handleResize);
            visualViewport.removeEventListener('scroll', handleResize);
        };
    }, []);

    return state;
}
