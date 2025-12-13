
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = './scripts/serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: scripts/serviceAccountKey.json not found.');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedUsers() {
    console.log('Seeding dummy users...');

    const users = [
        {
            uid: 'test_friend_01',
            displayName: 'Friend User',
            email: 'friend@test.com',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Friend',
            username: 'friend01',
            createdAt: FieldValue.serverTimestamp(),
            bio: 'I am a faithful friend available for testing interactions.',
            stats: {
                following: 5,
                followers: 10,
                devotionals: 3
            }
        },
        {
            uid: 'test_stranger_01',
            displayName: 'Stranger User',
            email: 'stranger@test.com',
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stranger',
            username: 'stranger01',
            createdAt: FieldValue.serverTimestamp(),
            bio: 'I am a stranger. You can follow me.',
            stats: {
                following: 0,
                followers: 0,
                devotionals: 0
            }
        }
    ];

    const batch = db.batch();

    for (const user of users) {
        const userRef = db.collection('users').doc(user.uid);
        batch.set(userRef, user, { merge: true });
        console.log(`Prepared user: ${user.displayName} (ID: ${user.uid})`);
    }

    // Create Relationships
    // Friend follows Stranger
    const friendRef = db.collection('users').doc('test_friend_01');
    const strangerRef = db.collection('users').doc('test_stranger_01');

    // Friend follows Stranger
    batch.set(friendRef.collection('following').doc('test_stranger_01'), { createdAt: FieldValue.serverTimestamp() });
    batch.set(strangerRef.collection('followers').doc('test_friend_01'), { createdAt: FieldValue.serverTimestamp() });

    // Update stats
    batch.update(friendRef, { 'stats.following': 1 }); // Override for test
    batch.update(strangerRef, { 'stats.followers': 1 });

    await batch.commit();
    console.log('Seeding complete!');
    console.log('Test URLs:');
    console.log('Friend: /profile/test_friend_01');
    console.log('Stranger: /profile/test_stranger_01');
}

seedUsers().catch(console.error);
