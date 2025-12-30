#!/bin/bash
set -e

# Directory for piper
mkdir -p tools/bible-audio/piper
cd tools/bible-audio/piper

# 1. Download Piper Binary (macOS arm64)
echo "Downloading Piper for macOS (arm64)..."
rm -rf piper || true
curl -L -o piper.tar.gz https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_macos_aarch64.tar.gz
tar -xzf piper.tar.gz
rm piper.tar.gz
echo "Piper binary downloaded."

# 2. Download Voices
# Voice 1: en_US-lessac-medium
if [ ! -f "en_US-lessac-medium.onnx" ]; then
    echo "Downloading en_US-lessac-medium..."
    curl -L -o en_US-lessac-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
    curl -L -o en_US-lessac-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
fi

# Voice: en_US-amy-medium (Female)
if [ ! -f "en_US-amy-medium.onnx" ]; then
    echo "Downloading en_US-amy-medium..."
    curl -L -o en_US-amy-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
    curl -L -o en_US-amy-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json
fi

# Voice: en_US-bryce-medium (Male)
if [ ! -f "en_US-bryce-medium.onnx" ]; then
    echo "Downloading en_US-bryce-medium..."
    curl -L -o en_US-bryce-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx
    curl -L -o en_US-bryce-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/bryce/medium/en_US-bryce-medium.onnx.json
fi

# Voice: en_GB-jenny_dioco-medium (Female)
if [ ! -f "en_GB-jenny_dioco-medium.onnx" ]; then
    echo "Downloading en_GB-jenny_dioco-medium..."
    curl -L -o en_GB-jenny_dioco-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx
    curl -L -o en_GB-jenny_dioco-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx.json
fi

# Voice: en_GB-cori-high
if [ ! -f "en_GB-cori-high.onnx" ]; then
    echo "Downloading en_GB-cori-high..."
    curl -L -o en_GB-cori-high.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx
    curl -L -o en_GB-cori-high.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx.json
fi

echo "Piper setup complete."
