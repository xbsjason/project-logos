import { useCallback, useRef, useState } from 'react';

interface Options {
    shouldPreventDefault?: boolean;
    delay?: number;
}

export default function useLongPress(
    onLongPress: (event: React.TouchEvent | React.MouseEvent) => void,
    onClick: (event: React.TouchEvent | React.MouseEvent) => void,
    { shouldPreventDefault = true, delay = 500 }: Options = {}
) {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const target = useRef<EventTarget | null>(null);
    const startX = useRef<number>(0);
    const startY = useRef<number>(0);
    const moveThreshold = 10;

    const start = useCallback(
        (event: React.TouchEvent | React.MouseEvent) => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener('touchend', preventDefault, { passive: false });
                target.current = event.target;
            }
            if (isTouchEvent(event)) {
                startX.current = event.touches[0].clientX;
                startY.current = event.touches[0].clientY;
            }
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const move = useCallback((event: React.TouchEvent) => {
        if (timeout.current) {
            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            if (
                Math.abs(currentX - startX.current) > moveThreshold ||
                Math.abs(currentY - startY.current) > moveThreshold
            ) {
                clear(event, false);
            }
        }
    }, []);

    const clear = useCallback(
        (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current);
            if (shouldTriggerClick && !longPressTriggered) {
                onClick(event);
            }
            setLongPressTriggered(false);
            if (shouldPreventDefault && target.current) {
                target.current.removeEventListener('touchend', preventDefault);
            }
        },
        [shouldPreventDefault, onClick, longPressTriggered]
    );

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
        onTouchMove: (e: React.TouchEvent) => move(e),
    };
}

const preventDefault = (e: any) => {
    if (!isTouchEvent(e)) return;

    if (e.touches.length < 2 && e.preventDefault) {
        e.preventDefault();
    }
};

const isTouchEvent = (e: any): e is React.TouchEvent => {
    return e && 'touches' in e;
};
