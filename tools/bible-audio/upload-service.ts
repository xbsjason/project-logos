import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import { createRequire } from 'module';

// @ts-ignore
const require = createRequire(import.meta.url);

// Initialize Firebase Admin
if (getApps().length === 0) {
    try {
        const serviceAccount = require('../../scripts/serviceAccountKey.json');
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'faithvoice-default.appspot.com' // Replace with your actual bucket if different
        });
        console.log('[Firebase] Admin initialized with service account.');
    } catch (error) {
        console.warn('[Firebase] Failed to load serviceAccountKey.json. Uploads will fail.', error);
    }
}

const storage = getStorage();
const db = getFirestore();

export async function uploadFile(localPath: string, destinationPath: string, contentType: string) {
    try {
        const bucket = storage.bucket();
        await bucket.upload(localPath, {
            destination: destinationPath,
            metadata: {
                contentType: contentType
            }
        });

        // Get public URL (optional, or just return path)
        const file = bucket.file(destinationPath);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
        return publicUrl;
    } catch (error: any) {
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export async function saveToFirestore(collection: string, docId: string, data: any) {
    try {
        await db.collection(collection).doc(docId).set(data, { merge: true });
    } catch (error: any) {
        throw new Error(`Firestore save failed: ${error.message}`);
    }
}

export async function checkExists(collection: string, docId: string): Promise<boolean> {
    const doc = await db.collection(collection).doc(docId).get();
    return doc.exists;
}
