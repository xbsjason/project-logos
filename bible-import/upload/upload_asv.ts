
import { uploadFile } from '../shared/uploader';
import * as path from 'path';
import * as fs from 'fs-extra';

const META_FILE = path.join(__dirname, '../sources/asv.source.json');
const INPUT_FILE = path.join(__dirname, '../output/asv.jsonl');

async function main() {
    if (!fs.existsSync(META_FILE)) throw new Error("Source meta not found. Run download first.");
    const meta = await fs.readJson(META_FILE);

    await uploadFile(INPUT_FILE, {
        id: 'ASV',
        name: meta.source_name,
        source_url: meta.source_url,
        license: meta.license_note
    });
}
main().catch(console.error);
