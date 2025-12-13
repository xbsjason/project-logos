import axios from 'axios';
import AdmZip from 'adm-zip';
import * as fs from 'fs-extra';
import * as path from 'path';

// Definition of sources
const VERSIONS = [
    {
        code: 'kjv',
        url: 'https://ebible.org/Scriptures/eng-kjv_usfm.zip',
        name: "King James Version",
        license: "Public Domain"
    },
    {
        code: 'web',
        url: 'https://ebible.org/Scriptures/eng-web_usfm.zip',
        name: "World English Bible",
        license: "Public Domain"
    },
    {
        code: 'asv',
        url: 'https://ebible.org/Scriptures/eng-asv_usfm.zip',
        name: "American Standard Version",
        license: "Public Domain"
    },
    {
        code: 'douay_rheims',
        url: 'https://ebible.org/Scriptures/engDRA_usfm.zip',
        name: "Douay-Rheims 1899 American Edition",
        license: "Public Domain"
    }
];

async function downloadFile(url: string, dest: string) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function main() {
    console.log("Starting Bible downloads...");

    for (const v of VERSIONS) {
        console.log(`Processing ${v.name} (${v.code})...`);
        const downloadDir = path.join(__dirname, 'downloads', v.code);
        const sourceDir = path.join(__dirname, 'sources');
        await fs.ensureDir(downloadDir);
        await fs.ensureDir(sourceDir);

        const zipPath = path.join(downloadDir, `${v.code}.zip`);

        // 1. Download
        try {
            console.log(`  Downloading from ${v.url}...`);
            await downloadFile(v.url, zipPath);
            console.log(`  Downloaded to ${zipPath}`);
        } catch (e) {
            console.error(`  Failed to download ${v.code}:`, e);
            continue;
        }

        // 2. Unzip
        try {
            console.log(`  Unzipping...`);
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(downloadDir, true);
            console.log(`  Unzipped.`);
        } catch (e) {
            console.error(`  Failed to unzip ${v.code}:`, e);
        }

        // 3. Verify and List Files
        const files = await fs.readdir(downloadDir);
        const usfmFiles = files.filter(f => f.endsWith('.usfm') || f.endsWith('.SFM'));
        console.log(`  Found ${usfmFiles.length} USFM files.`);

        // 4. Write Source Meta
        const sourceMeta = {
            version: v.code.toUpperCase(),
            source_name: v.name,
            source_url: v.url,
            license_note: v.license,
            downloaded_files: usfmFiles,
            downloaded_at: new Date().toISOString()
        };
        await fs.writeJson(path.join(sourceDir, `${v.code}.source.json`), sourceMeta, { spaces: 2 });
        console.log(`  Wrote metadata.`);
    }

    console.log("All downloads complete.");
}

main().catch(console.error);
