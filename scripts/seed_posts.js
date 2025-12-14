
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

const POSTS = [
    {
        id: 'seed_post_1',
        author: {
            name: 'GraceWalker',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace'
        },
        type: 'image',
        content: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop&q=80',
        caption: 'Morning quiet time. The sunrise reminds me of His mercies which are new every morning. #blessed #creation',
        likes: 124,
        comments: 15,
        shares: 4,
        createdAt: FieldValue.serverTimestamp(),
        verse: {
            ref: 'Lamentations 3:22-23',
            text: 'The steadfast love of the Lord never ceases; his mercies never come to an end...'
        }
    },
    {
        id: 'seed_post_2',
        author: {
            name: 'WorshipDaily',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Worship'
        },
        type: 'text',
        content: 'In the waiting, in the searching, in the healing, and the hurting... You are still God.',
        caption: 'He is faithful in every season.',
        likes: 89,
        comments: 8,
        shares: 22,
        createdAt: FieldValue.serverTimestamp(),
        song: {
            title: 'Seasons',
            artist: 'Hillsong Worship'
        }
    },
    {
        id: 'seed_post_3',
        author: {
            name: 'BibleStudyGroup',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Study'
        },
        type: 'verse_art',
        content: 'https://images.unsplash.com/photo-1507692049790-de58293a4697?w=800&auto=format&fit=crop&q=80',
        caption: 'Join us for reading John 3 tomorrow! Let’s dive deep.',
        likes: 45,
        comments: 20,
        shares: 1,
        createdAt: FieldValue.serverTimestamp(),
        verse: {
            ref: 'John 3:16',
            text: 'For God so loved the world that He gave His only begotten Son...'
        }
    },
    {
        id: 'seed_post_4',
        author: {
            name: 'SarahJ',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        type: 'prayer',
        content: 'Please pray for my mother\'s surgery tomorrow. We are trusting God for a full recovery and peace for the family.',
        caption: 'Trusting in Him.',
        likes: 0,
        comments: 24,
        shares: 2,
        createdAt: FieldValue.serverTimestamp(),
        prayerCount: 24,
        answered: false
    },
    {
        id: 'seed_post_5',
        author: {
            name: 'DavidM',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        type: 'praise',
        content: 'Praise report! I finally found a job after 6 months of searching. God is faithful to provide right on time!',
        caption: 'He is Jehovah Jireh!',
        likes: 0,
        comments: 45,
        shares: 10,
        createdAt: FieldValue.serverTimestamp(),
        prayerCount: 156,
        answered: true
    }
];

async function seedPosts() {
    console.log('Seeding posts...');
    const batch = db.batch();

    for (const post of POSTS) {
        const ref = db.collection('posts').doc(post.id);
        const { id, ...data } = post; // exclude id from data payload if we set doc id manually, but keeping it inside is fine too.
        batch.set(ref, data);
        console.log(`Prepared post: ${post.type} by ${post.author.name}`);
    }

    await batch.commit();
    console.log('Successfully seeded posts!');
}

seedPosts().catch(console.error);
