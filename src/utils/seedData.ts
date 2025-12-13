import { collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Mock data sources
const MOCK_USERS = [
    { username: 'GraceWalker', displayName: 'Grace Walker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace' },
    { username: 'WorshipDaily', displayName: 'Worship Daily', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Worship' },
    { username: 'BibleStudyGroup', displayName: 'Bible Study Group', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Study' },
    { username: 'DavidM', displayName: 'David Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { username: 'SarahJ', displayName: 'Sarah Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { username: 'YouthGroupLeader', displayName: 'Mike Youth', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youth' },
    { username: 'PrayerWarrior', displayName: 'Hannah Pray', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah' },
    { username: 'FaithSeeker', displayName: 'James Seek', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
    { username: 'JoyfulHeart', displayName: 'Joy Williams', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joy' },
    { username: 'Psalmist', displayName: 'Paul Singer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paul' }
];

const HASHTAGS = ['grace', 'faith', 'prayer', 'bible', 'worship', 'hope', 'love', 'jesus', 'blessed', 'morningdevotion', 'testimony', 'encouragement'];

const POST_CONTENTS = {
    prayer: [
        "Please pray for my mother's surgery tomorrow. We are trusting God for a full recovery. #prayer #healing",
        "Praise report! I finally found a job after 6 months of searching. God is faithful! #blessed #testimony #faith",
        "Praying for our upcoming retreat this weekend. That hearts would be open so we can see revival. #worship #faith",
        "Feeling overwhelmed today. Need strength and peace. #prayer #hope",
        "God is so good! He answered a prayer I've been praying for 5 years. Never give up hope! #testimony #faithfulness"
    ],
    text: [
        "Your faithfulness extends to every generation, like a thread of gold weaving through history. #faith #worship",
        "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures. #bible #psalms",
        "Trust in the Lord with all your heart and lean not on your own understanding. #wisdom #bible",
        "This is the day that the Lord has made; let us rejoice and be glad in it! #joy #worship",
        "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. #love #bible"
    ],
    image: [
        { url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60', caption: 'Quiet time this morning. The Lord is good! #blessed #morningdevotion', aspect: 'square' },
        { url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&auto=format&fit=crop&q=60', caption: 'Join us for reading John 3 tomorrow! #bible #study', aspect: 'wide' },
        { url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=60', caption: 'Look at this beautiful creation. #nature #worship', aspect: 'portrait' },
        { url: 'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=800&auto=format&fit=crop&q=60', caption: 'Faith can move mountains. #faith #hope', aspect: 'square' }
    ],
    video: [
        { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', caption: 'Big Buck Bunny sample video #fun #animation' },
        { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', caption: 'Elephants Dream #movie #short' }
    ]
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


// Helper to extract tags and mentions from text
const extractEntities = (text: string) => {
    const tags = (text.match(/#[a-z0-9_]+/gi) || []).map(tag => tag.slice(1).toLowerCase());
    const mentions = (text.match(/@[a-z0-9_]+/gi) || []).map(mention => mention.slice(1));
    return { tags, mentions };
};

export const seedDatabase = async () => {
    const batch = writeBatch(db);
    const usersCollection = collection(db, 'users');
    const postsCollection = collection(db, 'posts');

    console.log("Starting seed...");

    // 1. Seed Users
    const userIds: string[] = [];

    for (const user of MOCK_USERS) {
        const userRef = doc(usersCollection, user.username); // using username as ID for simplicity in seeding
        userIds.push(user.username);

        batch.set(userRef, {
            uid: user.username,
            username: user.username,
            displayName: user.displayName,
            photoURL: user.avatar,
            bio: `I love Jesus and coding. #${getRandomItem(HASHTAGS)}`,
            website: 'https://faithvoice.app',
            stats: {
                followers: Math.floor(Math.random() * 1000),
                following: Math.floor(Math.random() * 500),
                devotionals: Math.floor(Math.random() * 50)
            },
            email: `${user.username}@example.com`,
            createdAt: Timestamp.now()
        });
    }

    // 2. Seed Posts
    // Create ~80 posts
    for (let i = 0; i < 80; i++) {
        const postRef = doc(postsCollection);
        const authorId = getRandomItem(userIds);
        const author = MOCK_USERS.find(u => u.username === authorId)!; // should exist



        // Pick a type
        const rand = Math.random();
        let type: 'text' | 'image' | 'prayer' | 'verse_art' | 'video' = 'text';
        let content = '';
        let caption = '';
        let verse: any = null;
        let song: any = null;

        if (rand < 0.25) {
            // Prayer (25%)
            type = 'prayer';
            content = getRandomItem(POST_CONTENTS.prayer);
            if (!content.includes('#')) content += ` #${getRandomItem(HASHTAGS)}`;
        } else if (rand < 0.45) {
            // Image (20%)
            type = 'image';
            const img = getRandomItem(POST_CONTENTS.image);
            content = img.url;
            caption = img.caption;
        } else if (rand < 0.65) {
            // Text (20%)
            type = 'text';
            content = getRandomItem(POST_CONTENTS.text);
            if (Math.random() > 0.7) song = { title: "Way Maker", artist: "Sinach" };
        } else if (rand < 0.85) {
            // Verse Art (20%)
            type = 'verse_art';
            content = "https://images.unsplash.com/photo-1507643179173-61bba695f361?w=800&auto=format&fit=crop&q=60";
            caption = "My favorite verse. #bible";
            verse = { ref: "John 3:16", text: "For God so loved..." };
        } else {
            // Video (15%)
            type = 'video';
            const vid = getRandomItem(POST_CONTENTS.video);
            content = vid.url;
            caption = vid.caption;
        }

        // Parse entities
        const textToScan = (['text', 'prayer'].includes(type)) ? content : caption;
        const { tags, mentions } = extractEntities(textToScan);
        // Add random mentions if none
        if (mentions.length === 0 && Math.random() > 0.8) {
            const mentionedUser = getRandomItem(userIds);
            if (mentionedUser !== authorId) {
                mentions.push(mentionedUser);
                // We don't modify text here for simplicity, but in real app we would
            }
        }

        batch.set(postRef, {
            id: postRef.id,
            authorId: authorId,
            author: { // denormalized basic info
                name: author.displayName,
                avatar: author.avatar,
                username: author.username
            },
            type,
            content,
            caption, // exists for all, empty for text/prayer posts if they use content
            likes: Math.floor(Math.random() * 200),
            comments: Math.floor(Math.random() * 20),
            shares: Math.floor(Math.random() * 10),
            createdAt: Timestamp.fromMillis(Date.now() - Math.floor(Math.random() * 1000000000)), // Random time in last ~10 days
            tags,
            mentions,
            verse,
            song,
            // Prayer specific
            prayerCount: type === 'prayer' ? Math.floor(Math.random() * 50) : 0,
            prayedBy: {} // empty map initially
        });
    }

    try {
        await batch.commit();
        console.log("Seeding complete!");
        return true;
    } catch (e) {
        console.error("Seeding failed", e);
        return false;
    }
};
