import type { RenderConfig, WorkerMessage } from '../workers/verseArt.worker';

class VerseArtService {
    private worker: Worker | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private offscreen: OffscreenCanvas | null = null;

    constructor() {
        // Lazy init in methods to avoid SSR issues if we check typeof window
    }

    private initWorker() {
        if (!this.worker && typeof window !== 'undefined') {
            this.worker = new Worker(new URL('../workers/verseArt.worker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.onmessage = (e) => {
                const msg = e.data;
                console.log('[VerseArtService] Worker Msg:', msg);
                // Handle global error or debug messages here if needed
                if (msg.type === 'ERROR') {
                    console.error('[VerseArtService] Worker Error:', msg.error);
                }
            };
        }
    }

    public initCanvas(canvasElement: HTMLCanvasElement) {
        // StrictMode Protection:
        // If we are called again with the SAME canvas element that we already transferred,
        // we cannot transfer it again.
        if (this.canvas === canvasElement && this.worker) {
            console.log('[VerseArtService] Already initialized with this canvas. Skipping re-init.');
            return;
        }

        // If we are called with a NEW canvas (remount), we must reset.
        if (this.worker) {
            console.log('[VerseArtService] Terminating old worker to re-bind canvas');
            this.worker.terminate();
            this.worker = null;
        }

        try {
            this.initWorker();
            if (!this.worker) return;

            this.canvas = canvasElement;
            this.offscreen = this.canvas.transferControlToOffscreen();

            (this.worker as Worker).postMessage({
                type: 'INIT',
                canvas: this.offscreen,
                pixelRatio: window.devicePixelRatio || 1
            } as WorkerMessage, [this.offscreen]);

            console.log('[VerseArtService] Initialized new worker and canvas');
        } catch (e: any) {
            // Handle "Cannot transfer control..." if it happens despite checks
            if (e.message && e.message.includes('transfer control')) {
                console.warn('[VerseArtService] Canvas already transferred. Ignoring Re-Init.');
                // We assume the previous worker is still valid if we are here, 
                // OR we are in a broken state. 
                // If we are in a broken state (worker null but canvas transferred), we can't recover this canvas element.
            } else {
                console.error('Failed to init Verse Art canvas', e);
            }
        }
    }

    public render(config: RenderConfig) {
        if (!this.worker) {
            this.initWorker();
        }

        if (!this.worker) {
            console.warn('[VerseArtService] Cannot render: Worker not initialized');
            return;
        }

        // Ensure we send RENDER command
        // If the worker was just re-initialized, this might race with INIT, but JS messaging is ordered for same worker.
        this.worker.postMessage({
            type: 'RENDER',
            config
        } as WorkerMessage);
    }

    public async exportImage(format: 'image/png' | 'image/jpeg' = 'image/png'): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.worker) return reject('Worker not initialized');

            // One-time listener for this export
            const handler = (e: MessageEvent) => {
                const msg = e.data;
                if (msg.type === 'EXPORT_COMPLETE') {
                    this.worker?.removeEventListener('message', handler);
                    resolve(msg.blob);
                } else if (msg.type === 'ERROR') {
                    this.worker?.removeEventListener('message', handler);
                    reject(msg.error);
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ type: 'EXPORT', format } as WorkerMessage);
        });
    }

    public destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.canvas = null;
        this.offscreen = null;
    }
}

export const verseArtService = new VerseArtService();
