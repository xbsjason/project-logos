import type { RenderConfig, WorkerMessage } from '../workers/verseArt.worker';

class VerseArtService {
    private worker: Worker | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private offscreen: OffscreenCanvas | null = null;
    private isInitialized = false;

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
        if (this.isInitialized) return; // Already init (though handling re-init for re-mounts is tricky with transferControlToOffscreen)

        // Note: transferControlToOffscreen can ONLY be called once per canvas element.
        // If React unmounts/remounts the component, we need to handle that.
        // Ideally, we create the canvas once or passing a fresh one is handled carefully.

        try {
            this.initWorker();
            if (!this.worker) return;

            this.canvas = canvasElement;
            this.offscreen = this.canvas.transferControlToOffscreen();

            this.worker.postMessage({
                type: 'INIT',
                canvas: this.offscreen,
                pixelRatio: window.devicePixelRatio || 1
            } as WorkerMessage, [this.offscreen]);

            this.isInitialized = true;
        } catch (e) {
            console.error('Failed to init Verse Art canvas', e);
        }
    }

    public render(config: RenderConfig) {
        if (!this.worker) this.initWorker();
        this.worker?.postMessage({
            type: 'RENDER',
            config
        } as WorkerMessage);
    }

    public async exportImage(format: 'image/png' | 'image/jpeg' = 'image/png'): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.worker) return reject('Worker not initialized');

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
        this.isInitialized = false;
        this.canvas = null;
        this.offscreen = null;
    }
}

export const verseArtService = new VerseArtService();
