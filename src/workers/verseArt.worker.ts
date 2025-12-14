/// <reference lib="webworker" />

export interface RenderConfig {
    width: number;
    height: number;
    text: string;
    reference: string;
    version: string; // e.g., "KJV", "NIV"
    gradientColors: string[];
    gradientType: 'linear' | 'radial';
    textColor: string; // Hex color
    fontUrl?: string; // Optional custom font URL
}

export type WorkerMessage =
    | { type: 'INIT'; canvas: OffscreenCanvas; pixelRatio: number }
    | { type: 'RENDER'; config: RenderConfig }
    | { type: 'EXPORT'; format?: 'image/png' | 'image/jpeg'; quality?: number };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
// let pixelRatio = 1;

// Custom Font Loading
async function loadFonts(fontUrl: string, fontFamily: string) {
    try {
        const font = new FontFace(fontFamily, `url(${fontUrl})`);
        await font.load();
        self.fonts.add(font);
    } catch (e) {
        console.error(`Failed to load font ${fontFamily}`, e);
    }
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;

    switch (msg.type) {
        case 'INIT':
            canvas = msg.canvas;
            ctx = canvas.getContext('2d', { alpha: false });
            // Load default fonts
            // We can load them from CDN for now to ensure they work in the worker
            loadFonts('https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmj5BN2Owl705cJ.woff2', 'Playfair Display');
            loadFonts('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', 'Inter');
            break;

        case 'RENDER':
            if (ctx && canvas) {
                await render(ctx, canvas, msg.config);
                self.postMessage({ type: 'RENDER_COMPLETE' });
            }
            break;

        case 'EXPORT':
            if (canvas) {
                try {
                    const blob = await canvas.convertToBlob({
                        type: msg.format || 'image/png',
                        quality: msg.quality || 1.0
                    });
                    self.postMessage({ type: 'EXPORT_COMPLETE', blob });
                } catch (error: any) {
                    console.error('Export failed', error);
                    self.postMessage({ type: 'ERROR', error: error.message });
                }
            }
            break;
    }
};

async function render(
    ctx: OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    config: RenderConfig
) {
    const { width, height, text, reference, version, gradientColors, gradientType, textColor } = config;

    // Reset canvas to requested size (handling pixel ratio is crucial for sharpness)
    // The canvas logical size (width/height style) is handled by the main thread.
    // Here we deal with physical pixels.
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    // 1. Draw Background
    drawGradient(ctx, width, height, gradientColors, gradientType);

    // 2. Load Fonts (if needed)
    // Ideally fonts are preloaded by the main thread or service worker, 
    // but we can ensure they are available here.
    // For now, we'll use system fonts or assumed loaded web fonts.
    // 'Inter' or 'serif' fallback.

    // 3. Draw Text
    drawVerseText(ctx, width, height, text, reference, version, textColor);
}

function drawGradient(
    ctx: OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    colors: string[],
    type: 'linear' | 'radial'
) {
    let gradient: CanvasGradient;

    if (type === 'radial') {
        // Center radial gradient
        gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.5);
    } else {
        // Top-left to bottom-right linear gradient
        gradient = ctx.createLinearGradient(0, 0, width, height);
    }

    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawVerseText(
    ctx: OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    text: string,
    reference: string,
    version: string,
    textColor: string
) {
    // Configuration
    const padding = Math.floor(width * 0.1); // 10% padding
    // const safeWidth = width - (padding * 2);
    // const safeHeight = height - (padding * 2);

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Fonts
    // Used directly in logic below
    // const fontPrimary = "700 italic 20px 'Playfair Display', serif"; 
    // const fontSecondary = "600 20px 'Inter', sans-serif"; 
    // const fontTertiary = "400 16px 'Inter', sans-serif";

    // Branding Footer
    ctx.font = `bold ${Math.floor(width * 0.03)}px 'Inter', sans-serif`;
    const brandingText = "FAITHVOICE VERSE ART";
    const brandingY = height - Math.floor(padding * 0.6);
    ctx.globalAlpha = 0.6;
    ctx.fillText(brandingText, width / 2, brandingY);
    ctx.globalAlpha = 1.0;

    // Tertiary: Version
    // Positioned slightly above branding or with reference? Specs say:
    // "Secondary Text: Book, Chapter, and Verse number"
    // "Tertiary Text: Bible Version"

    // Let's layout Reference area at the bottom, above branding
    // Then the main verse takes up the remaining center space.

    // Calculate Available Height for Verse
    // Top Padding -> Verse -> Reference -> Version -> Branding -> Bottom Padding
    const bottomReserved = Math.floor(height * 0.25); // Reserve bottom 25% for ref/branding
    const topReserved = Math.floor(height * 0.15); // Top 15% breathing room
    const contentCenterY = (height - bottomReserved + topReserved) / 2;
    const maxTextWidth = width - (padding * 2);

    // Reference & Version Block
    const refY = height - Math.floor(height * 0.15);
    const versionY = refY + Math.floor(height * 0.04);

    // Draw Reference
    const refFontSize = Math.floor(width * 0.06); // 6% of width
    ctx.font = `bold ${refFontSize}px 'Inter', sans-serif`;
    ctx.fillText(reference, width / 2, refY);

    // Draw Version
    const verFontSize = Math.floor(width * 0.035);
    ctx.font = `${verFontSize}px 'Inter', sans-serif`;
    ctx.fillText(version, width / 2, versionY);

    // Dynamic Font Scaling for Verse
    // We want the text to fill the visual center. 
    // We start with a large font and scale down until it fits.
    let fontSize = Math.floor(width * 0.12); // Start big (12% of width)
    const minFontSize = Math.floor(width * 0.05); // Don't go smaller than 5%
    let lines: string[] = [];

    // Initial font set for measurement
    ctx.font = `italic 700 ${fontSize}px 'Playfair Display', serif`;

    // Iterative shrinking
    while (fontSize > minFontSize) {
        ctx.font = `italic 700 ${fontSize}px 'Playfair Display', serif`;
        lines = getLines(ctx, text, maxTextWidth);

        const totalTextHeight = lines.length * (fontSize * 1.5); // 1.5 line height
        const availableHeight = height - bottomReserved - topReserved;

        if (totalTextHeight <= availableHeight) {
            break; // It fits!
        }

        fontSize -= 2; // Shrink and try again
    }

    // Render Lines
    const lineHeight = fontSize * 1.4;
    const totalBlockHeight = lines.length * lineHeight;
    let startY = contentCenterY - (totalBlockHeight / 2) + (lineHeight / 2); // Center vertically

    lines.forEach((line) => {
        // Enforce integer coordinates for sharpness
        const xPos = Math.round(width / 2);
        const yPos = Math.round(startY);
        ctx.fillText(line, xPos, yPos);
        startY += lineHeight;
    });
}

function getLines(ctx: OffscreenCanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
