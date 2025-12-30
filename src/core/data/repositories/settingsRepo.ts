import { dbPromise, type UserSettings } from '../db/db';

const DEFAULT_SETTINGS: UserSettings = {
    id: 'global', // or userId
    pushEnabled: false,
    soundEnabled: true,
    vibrationEnabled: true,
    channels: {
        messages: true,
        mentions: true,
        likes: true,
        comments: true,
        system: true,
    },
};

export const settingsRepo = {
    async getSettings(userId: string = 'global'): Promise<UserSettings> {
        const db = await dbPromise;
        const settings = await db.get('settings', userId);
        if (!settings) {
            // Return defaults but don't save yet until they customize
            return { ...DEFAULT_SETTINGS, id: userId };
        }
        return settings;
    },

    async saveSettings(settings: UserSettings): Promise<void> {
        const db = await dbPromise;
        await db.put('settings', settings);
    }
};
