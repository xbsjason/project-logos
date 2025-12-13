import * as fs from 'fs-extra';
import * as path from 'path';
import { parseUsfmFiles } from '../shared/usfm_parser';

const VERSION = 'KJV';
const INPUT_DIR = path.join(__dirname, '../downloads/kjv');
const OUTPUT_FILE = path.join(__dirname, '../output/kjv.jsonl');

async function main() {
    await fs.ensureDir(path.dirname(OUTPUT_FILE));

    if (!await fs.pathExists(INPUT_DIR)) {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        return;
    }

    const files = (await fs.readdir(INPUT_DIR))
        .filter(f => f.endsWith('.usfm') || f.endsWith('.SFM'))
        .map(f => path.join(INPUT_DIR, f));

    await fs.writeFile(OUTPUT_FILE, '');
    const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });

    console.log(`Parsing ${VERSION} from ${files.length} files...`);

    let count = 0;
    await parseUsfmFiles(files, { version: VERSION }, async (verse) => {
        stream.write(JSON.stringify(verse) + '\n');
        count++;
        if (count % 1000 === 0) process.stdout.write(`\r${count} verses parsed...`);
    });

    console.log(`\nDone. ${count} verses written to ${OUTPUT_FILE}`);
}

main().catch(console.error);
