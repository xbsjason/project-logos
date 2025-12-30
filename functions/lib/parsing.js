"use strict";
/**
 * Text parsing utilities for Cloud Functions
 * Mirror of client-side parsing logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMentions = parseMentions;
exports.parseHashtags = parseHashtags;
exports.parseTextEntities = parseTextEntities;
exports.resolveUsernames = resolveUsernames;
/**
 * Parse @mentions from text
 */
function parseMentions(text) {
    if (!text)
        return [];
    const mentionRegex = /(?:^|[\s\p{P}])@([a-zA-Z0-9_.]{3,30})(?=[\s\p{P}]|$)/gu;
    const matches = text.matchAll(mentionRegex);
    const usernames = new Set();
    for (const match of matches) {
        const username = match[1];
        // Exclude if it looks like an email
        const atIndex = match.index + match[0].indexOf('@');
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
function parseHashtags(text) {
    if (!text)
        return [];
    const hashtagRegex = /(?:^|[\s\p{P}])#([a-zA-Z0-9_]{2,50})(?=[\s\p{P}]|$)/gu;
    const matches = text.matchAll(hashtagRegex);
    const tags = new Set();
    for (const match of matches) {
        const tag = match[1];
        // Exclude if inside a URL
        const hashIndex = match.index + match[0].indexOf('#');
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
function parseTextEntities(text) {
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
async function resolveUsernames(usernames, firestore) {
    const resolved = new Map();
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
        }
        catch (error) {
            console.error(`Error resolving username ${username}:`, error);
        }
    }
    return resolved;
}
//# sourceMappingURL=parsing.js.map