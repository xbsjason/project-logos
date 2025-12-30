/**
 * Text parsing utilities for Cloud Functions
 * Mirror of client-side parsing logic
 */

export interface ParsedEntities {
    mentions: string[];  // Array of unique usernames (without @)
    hashtags: string[];  // Array of unique tags (without #, lowercased)
}

/**
 * Parse @mentions from text
 */
export function parseMentions(text: string): string[] {
    if (!text) return [];

    const mentionRegex = /(?:^|[\s\p{P}])@([a-zA-Z0-9_.]{3,30})(?=[\s\p{P}]|$)/gu;
    const matches = text.matchAll(mentionRegex);
    const usernames = new Set<string>();

    for (const match of matches) {
        const username = match[1];

        // Exclude if it looks like an email
        const atIndex = match.index! + match[0].indexOf('@');
        if (atIndex > 0 && /[a-zA-Z0-9]/.test(text[atIndex - 1])) {
            continue;
        }

        // Exclude if inside a URL
        const beforeContext = text.substring(Math.max(0, atIndex - 10), atIndex);
        if (beforeContext.includes('://') || beforeContext.includes('www.')) {
            continue;
        }

        usernames.add(username);
    }

    return Array.from(usernames);
}

/**
 * Parse #hashtags from text
 */
export function parseHashtags(text: string): string[] {
    if (!text) return [];

    const hashtagRegex = /(?:^|[\s\p{P}])#([a-zA-Z0-9_]{2,50})(?=[\s\p{P}]|$)/gu;
    const matches = text.matchAll(hashtagRegex);
    const tags = new Set<string>();

    for (const match of matches) {
        const tag = match[1];

        // Exclude if inside a URL
        const hashIndex = match.index! + match[0].indexOf('#');
        const beforeContext = text.substring(Math.max(0, hashIndex - 10), hashIndex);
        if (beforeContext.includes('://') || beforeContext.includes('www.')) {
            continue;
        }

        tags.add(tag.toLowerCase());
    }

    return Array.from(tags);
}

/**
 * Parse both mentions and hashtags from text
 */
export function parseTextEntities(text: string): ParsedEntities {
    return {
        mentions: parseMentions(text),
        hashtags: parseHashtags(text)
    };
}

/**
 * Resolve usernames to UIDs
 * @param usernames Array of usernames to resolve
 * @param firestore Firestore instance
 * @returns Map of username -> uid
 */
export async function resolveUsernames(
    usernames: string[],
    firestore: FirebaseFirestore.Firestore
): Promise<Map<string, string>> {
    const resolved = new Map<string, string>();

    // Query users by username (case-insensitive)
    for (const username of usernames) {
        try {
            const usersRef = firestore.collection('users');
            const snapshot = await usersRef
                .where('username', '==', username)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                resolved.set(username, userDoc.id);
            }
        } catch (error) {
            console.error(`Error resolving username ${username}:`, error);
        }
    }

    return resolved;
}
