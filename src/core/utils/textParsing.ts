/**
 * Text parsing utilities for mentions and hashtags
 * 
 * Handles extraction of @mentions and #hashtags from text with proper validation
 * and edge case handling (emails, URLs, punctuation, etc.)
 */

export interface ParsedEntities {
    mentions: string[];  // Array of unique usernames (without @)
    hashtags: string[];  // Array of unique tags (without #, lowercased)
}

/**
 * Parse @mentions from text
 * 
 * Rules:
 * - Must start with @ preceded by start of string, whitespace, or punctuation
 * - Username: 3-30 chars, letters/numbers/underscore/period
 * - Does NOT match emails (e.g., test@email.com)
 * - Does NOT match mentions inside URLs
 * - Excludes trailing punctuation
 * 
 * @param text - Text to parse
 * @returns Array of unique usernames (without @)
 */
export function parseMentions(text: string): string[] {
    if (!text) return [];

    // Regex explanation:
    // (?:^|[\s\p{P}])  - Start of string OR whitespace OR punctuation (non-capturing)
    // @                - Literal @ symbol
    // ([a-zA-Z0-9_.]{3,30}) - Username: letters, numbers, underscore, period (3-30 chars)
    // (?=[\s\p{P}]|$)  - Followed by whitespace, punctuation, or end (lookahead, not captured)
    const mentionRegex = /(?:^|[\s\p{P}])@([a-zA-Z0-9_.]{3,30})(?=[\s\p{P}]|$)/gu;

    const matches = text.matchAll(mentionRegex);
    const usernames = new Set<string>();

    for (const match of matches) {
        const username = match[1];

        // Additional validation: exclude if it looks like an email
        // Check if @ is preceded by alphanumeric (email pattern)
        const atIndex = match.index! + match[0].indexOf('@');
        if (atIndex > 0 && /[a-zA-Z0-9]/.test(text[atIndex - 1])) {
            continue; // Skip, likely an email
        }

        // Exclude if inside a URL
        const beforeContext = text.substring(Math.max(0, atIndex - 10), atIndex);
        if (beforeContext.includes('://') || beforeContext.includes('www.')) {
            continue; // Skip, likely in a URL
        }

        usernames.add(username);
    }

    return Array.from(usernames);
}

/**
 * Parse #hashtags from text
 * 
 * Rules:
 * - Must start with # preceded by start of string, whitespace, or punctuation
 * - Tag: 2-50 chars, letters/numbers/underscore (supports camelCase)
 * - Does NOT include trailing punctuation
 * - Does NOT match hashtags inside URLs (e.g., https://site.com/#section)
 * - Returns lowercase tags
 * 
 * @param text - Text to parse
 * @returns Array of unique tags (without #, lowercased)
 */
export function parseHashtags(text: string): string[] {
    if (!text) return [];

    // Regex explanation:
    // (?:^|[\s\p{P}])  - Start of string OR whitespace OR punctuation (non-capturing)
    // #                - Literal # symbol
    // ([a-zA-Z0-9_]{2,50}) - Tag: letters, numbers, underscore (2-50 chars)
    // (?=[\s\p{P}]|$)  - Followed by whitespace, punctuation, or end (lookahead)
    const hashtagRegex = /(?:^|[\s\p{P}])#([a-zA-Z0-9_]{2,50})(?=[\s\p{P}]|$)/gu;

    const matches = text.matchAll(hashtagRegex);
    const tags = new Set<string>();

    for (const match of matches) {
        const tag = match[1];

        // Exclude if inside a URL (check for :// before the #)
        const hashIndex = match.index! + match[0].indexOf('#');
        const beforeContext = text.substring(Math.max(0, hashIndex - 10), hashIndex);
        if (beforeContext.includes('://') || beforeContext.includes('www.')) {
            continue; // Skip, likely a URL fragment
        }

        tags.add(tag.toLowerCase());
    }

    return Array.from(tags);
}

/**
 * Parse both mentions and hashtags from text
 * 
 * @param text - Text to parse
 * @returns Object with mentions and hashtags arrays
 */
export function parseTextEntities(text: string): ParsedEntities {
    return {
        mentions: parseMentions(text),
        hashtags: parseHashtags(text)
    };
}

/**
 * Validate username format
 * 
 * @param username - Username to validate (without @)
 * @returns true if valid
 */
export function isValidUsername(username: string): boolean {
    if (!username) return false;
    if (username.length < 3 || username.length > 30) return false;
    return /^[a-zA-Z0-9_.]+$/.test(username);
}

/**
 * Validate hashtag format
 * 
 * @param tag - Tag to validate (without #)
 * @returns true if valid
 */
export function isValidHashtag(tag: string): boolean {
    if (!tag) return false;
    if (tag.length < 2 || tag.length > 50) return false;
    return /^[a-zA-Z0-9_]+$/.test(tag);
}
