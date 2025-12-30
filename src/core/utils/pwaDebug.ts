/**
 * Debug tool to clear PWA cache and service workers.
 * Usage: Call this function from the console or a hidden button.
 */
export const debugClearPwaCache = async () => {
    if (!confirm('Reset PWA Cache and Reload?')) return;
    try {
        console.group('🧹 PWA Cleanup');
        // alert('Starting PWA Cleanup...'); // Visual feedback

        // 1. Unregister Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log('Unregistered SW scope:', registration.scope);
            }
        }

        // 2. Clear Cache Storage
        if ('caches' in window) {
            const keys = await caches.keys();
            for (const key of keys) {
                await caches.delete(key);
                console.log('Deleted cache:', key);
            }
        }

        console.log('reloading...');
        console.groupEnd();

        // 4. Reload
        window.location.reload();
    } catch (e) {
        console.error('Failed to clear PWA cache:', e);
        alert('Failed to clear cache: ' + e);
    }
};
