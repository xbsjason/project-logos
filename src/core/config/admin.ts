// Admin Configuration
// Master admin and role-based access control

export const ADMIN_CONFIG = {
    // Master admin - has all privileges
    masterAdmin: 'xbsjason@gmail.com',

    // Additional admins (emails)
    admins: [
        'xbsjason@gmail.com',
    ],

    // Moderators (limited admin powers)
    moderators: [] as string[],
};

// Check if a user is a master admin
export function isMasterAdmin(email?: string | null): boolean {
    if (!email) return false;
    return email.toLowerCase() === ADMIN_CONFIG.masterAdmin.toLowerCase();
}

// Check if a user is any type of admin
export function isAdmin(email?: string | null): boolean {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return ADMIN_CONFIG.admins.some(admin => admin.toLowerCase() === lowerEmail);
}

// Check if a user is a moderator
export function isModerator(email?: string | null): boolean {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return ADMIN_CONFIG.moderators.some(mod => mod.toLowerCase() === lowerEmail);
}

// Check if user has any elevated permissions
export function hasElevatedPermissions(email?: string | null): boolean {
    return isAdmin(email) || isModerator(email);
}
