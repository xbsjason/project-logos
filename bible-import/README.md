# Bible Import Pipeline

This tool allows you to download, parse, and upload public domain Bible translations (KJV, WEB, ASV, Douay-Rheims) to Firebase Firestore.

## Prerequisites

- Node.js (v18+)
- Firebase Project with Firestore enabled

## Setup

1. **Install dependencies**:
   ```bash
   cd bible-import
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your Firebase credentials.
   ```bash
   cp .env.example .env
   ```
   *Note: You need a Service Account key from Firebase Console > Project Settings > Service Accounts.*

## Usage

### 1. Download Sources
Download the USFM files from ebible.org:
```bash
npm run download
```
This populates `downloads/` and `sources/`.

### 2. Parse Sources
Convert USFM to JSONL format (one verse per line):
```bash
npm run parse:kjv
npm run parse:web
npm run parse:asv
npm run parse:douay
```
Each command produces a file in `output/` (e.g., `output/kjv.jsonl`).
Logs will show the number of verses parsed.

### 3. Upload to Firestore
Upload the parsed data to your Firestore project.
**Warning**: This performs many write operations.
```bash
npm run upload:kjv
npm run upload:web
npm run upload:asv
npm run upload:douay
```

## Schema

### Collection Structure
- `bibles/{version}`: Metadata about the version (name, license).
- `bibles/{version}/verses/{bookId}_{chapter}_{verse}`: Individual verse records.

### Verse Record
```typescript
{
  version: "KJV",
  testament: "OT" | "NT",
  bookId: "gen",
  bookName: "Genesis",
  chapter: 1,
  verse: 1,
  reference: "Genesis 1:1",
  text: "In the beginning...",
  key: "KJV:gen:1:1"
}
```

## Troubleshooting
- **Missing Books**: Check if `canon.ts` maps the USFM ID correctly.
- **Upload Failures**: Ensure your Service Account has Firestore Writer permissions. Use the `resumeKey` option in code if needed (or implement CLI flag).
