import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// @ts-ignore
const require = createRequire(import.meta.url);
const app = express();
const PORT = 5005;

app.use(cors());

// Map IDs to Onnx files (relative to tools/bible-audio/piper)
// We only support the reliable Lessac Medium voice for now (and old GB one)
const VOICE_MAP: Record<string, string> = {
    'en_US-lessac-medium': 'en_US-lessac-medium.onnx',
    'en_US-amy-medium': 'en_US-amy-medium.onnx',
    'en_US-bryce-medium': 'en_US-bryce-medium.onnx',
    'en_GB-jenny_dioco-medium': 'en_GB-jenny_dioco-medium.onnx',
    'en_US-hifi-tts_low': 'en_US-lessac-medium.onnx', // Fallback
    'en_GB-cori-high': 'en_GB-cori-high.onnx',
};

app.get('/api/tts', async (req, res) => {
    try {
        const text = req.query.text as string;
        const voiceId = req.query.voiceId as string || 'en_US-lessac-medium';
        const rate = req.query.rate ? parseFloat(req.query.rate as string) : 1.0;

        if (!text) {
            return res.status(400).send('Missing text');
        }

        const modelFile = VOICE_MAP[voiceId] || VOICE_MAP['en_US-lessac-medium'];

        const piperDir = path.resolve('tools/bible-audio/piper');
        const modelPath = path.join(piperDir, modelFile);

        // Use the pip-installed piper in the venv
        const piperExec = path.resolve('tools/bible-audio/venv/bin/piper');

        if (!fs.existsSync(modelPath)) {
            return res.status(500).send(`Voice model not found: ${modelFile}. Did you run setup-piper.sh?`);
        }

        if (!fs.existsSync(piperExec)) {
            return res.status(500).send(`Piper executable not found at ${piperExec}. Run 'pip install piper-tts'`);
        }

        // Note: Piper lengthScale is inverse of speed. 
        const lengthScale = 1.0 / rate;

        console.log(`[Piper] Generating "${text.substring(0, 20)}..." using ${voiceId} (scale=${lengthScale.toFixed(2)})`);

        const tempDir = path.resolve('public/temp_tts');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
        const outPath = path.join(tempDir, filename);

        // Echo text | piper ...
        // We use spawn and pipe stdin
        const piper = spawn(piperExec, [
            '--model', modelPath,
            '--output_file', outPath,
            '--length_scale', lengthScale.toString()
        ]);

        piper.stdin.write(text);
        piper.stdin.end();

        piper.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Piper] command failed with code ${code}`);
                return res.status(500).send('Piper Generation Failed (Non-zero exit code)');
            }

            if (fs.existsSync(outPath)) {
                res.sendFile(outPath, () => {
                    // Cleanup? Maybe keep for cache?
                    // fs.unlinkSync(outPath); 
                });
            } else {
                res.status(500).send('Output file not found');
            }
        });

        piper.on('error', (err) => {
            console.error('[Piper] Spawn error:', err);
            res.status(500).send(`Spawn Error: ${err.message}`);
        });

        piper.stderr.on('data', (data) => {
            console.log(`[Piper Log] ${data}`);
        });

    } catch (err: any) {
        console.error('[TTS] Server error:', err);
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Piper TTS Server (VENV) running at http://localhost:${PORT}`);
});
