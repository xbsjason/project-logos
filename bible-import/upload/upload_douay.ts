
import { uploadFile } from '../shared/uploader';
import * as path from 'path';
import * as fs from 'fs-extra';

// Note: Douay doesn't have a generated source.json if it failed before?
// Ideally download scipt generates it now.
const META_FILE = path.join(__dirname, '../sources/douay_rheims.source.json');
const INPUT_FILE = path.join(__dirname, '../output/douay.jsonl');

async function main() {
    // Fallback if meta missing?
    let meta = { source_name: "Douay-Rheims", source_url: "https://ebible.org", license_note: "Public Domain" };
    if (fs.existsSync(META_FILE)) {
        meta = await fs.readJson(META_FILE);
    }

    await uploadFile(INPUT_FILE, {
        id: 'DRA',
        name: meta.source_name,
        source_url: meta.source_url,
        license: meta.license_note
    });
}
main().catch(console.error);
