import { AudioConfig } from './types.js';
import fs from 'fs';

export interface TTSRequest {
    text: string;
    voiceId: string;
    config: AudioConfig;
    outPath: string;
}

export async function synthesizeToFile(req: TTSRequest): Promise<void> {
    const { text, voiceId, config, outPath } = req;

    // Construct search params
    const params = new URLSearchParams({
        text: text,
        voiceId: voiceId,
        rate: config.speakingRate.toString(),
        pitch: config.pitch.toString(),
        volume: config.volume.toString(),
    });

    const url = `${config.ttsBaseUrl}/api/tts?${params.toString()}`;

    // Retry logic
    let lastError: Error | null = null;
    for (let i = 0; i <= config.retryCount; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`TTS server responded with ${response.status}: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(outPath, Buffer.from(buffer));
            return;
        } catch (error) {
            lastError = error as Error;
            // Linear backoff: 1s, 2s, 3s...
            await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
        }
    }

    throw new Error(`Failed to synthesize text after ${config.retryCount + 1} attempts. Last error: ${lastError?.message}`);
}
