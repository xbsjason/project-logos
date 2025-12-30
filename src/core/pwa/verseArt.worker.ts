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
    textShadow?: boolean; // Enable text shadow
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
    const { width, height, text, reference, version, gradientColors, gradientType, textColor, textShadow } = config;

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
    // Draw Text with layout config based on aspect ratio
    drawVerseText(ctx, width, height, text, reference, version, textColor, textShadow);
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

    // Safely add color stops
    if (colors && colors.length > 0) {
        colors.forEach((color, index) => {
            // Protect against invalid colors crashing the worker?
            // CanvasGradient just ignores bad values usually.
            gradient.addColorStop(index / (colors.length - 1), color);
        });
    } else {
        // Fallback for no colors
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#333333');
    }

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
    textColor: string,
    textShadow?: boolean
) {
    // Configuration relative to the SMALLER dimension to ensure consistency
    const minDim = Math.min(width, height);
    // const isPortrait = height > width; // Unused

    // Margins
    const padding = Math.floor(minDim * 0.08); // 8% padding

    // Layout Areas
    // Branding at very bottom
    // Version/Ref above branding
    // Verse centered in remaining space

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Apply Shadow if enabled
    if (textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = Math.floor(minDim * 0.01);
        ctx.shadowOffsetX = Math.floor(minDim * 0.005);
        ctx.shadowOffsetY = Math.floor(minDim * 0.005);
    } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Branding Footer
    const brandingFontSize = Math.floor(minDim * 0.03);
    ctx.font = `bold ${brandingFontSize}px 'Inter', sans-serif`;
    const brandingText = "FAITHVOICE VERSE ART";
    // Position branding near bottom edge
    const brandingY = height - Math.floor(padding * 0.8);
    ctx.globalAlpha = 0.6;
    ctx.fillText(brandingText, width / 2, brandingY);
    ctx.globalAlpha = 1.0;

    // Reference & Version Block
    // Position them above branding

    // Reference Font Size
    const refFontSize = Math.floor(minDim * 0.06); // 6% of min dimension
    const verFontSize = Math.floor(minDim * 0.035);

    // Calculate positions working upwards from branding
    const distBrandingToVer = Math.floor(minDim * 0.05);
    const distVerToRef = Math.floor(minDim * 0.04);

    const versionY = brandingY - distBrandingToVer - brandingFontSize;
    const refY = versionY - distVerToRef - verFontSize;

    // Draw Reference
    ctx.font = `bold ${refFontSize}px 'Inter', sans-serif`;
    ctx.fillText(reference, width / 2, refY);

    // Draw Version
    ctx.font = `${verFontSize}px 'Inter', sans-serif`;
    ctx.fillText(version, width / 2, versionY);

    // Verse Rendering
    // Available height for Verse is from Top Padding to a bit above Reference
    const topLimit = padding * 1.5; // Top padding + header space
    const bottomLimit = refY - (refFontSize * 1.5); // Space above reference
    const availableHeight = bottomLimit - topLimit;
    const availableWidth = width - (padding * 2);
    const contentCenterY = topLimit + (availableHeight / 2);

    // Dynamic Font Scaling for Verse
    // Start big and shrink
    let fontSize = Math.floor(minDim * 0.15); // Start at 15% of min dimension
    const minFontSize = Math.floor(minDim * 0.04); // Don't go smaller than 4%
    let lines: string[] = [];

    // Iterative shrinking
    ctx.font = `italic 700 ${fontSize}px 'Playfair Display', serif`; // Set initial for measurement loop

    while (fontSize > minFontSize) {
        ctx.font = `italic 700 ${fontSize}px 'Playfair Display', serif`;
        lines = getLines(ctx, text, availableWidth);

        const lineHeight = fontSize * 1.4;
        const totalTextHeight = lines.length * lineHeight;

        if (totalTextHeight <= availableHeight) {
            break; // It fits!
        }

        fontSize -= 2; // Shrink
    }

    // Render Lines
    const lineHeight = fontSize * 1.4;
    const totalBlockHeight = lines.length * lineHeight;
    let startY = contentCenterY - (totalBlockHeight / 2) + (lineHeight / 2);

    lines.forEach((line) => {
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
