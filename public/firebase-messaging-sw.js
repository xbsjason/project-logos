importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// We must use the values from the environment, but since this is a JS file served statically,
// we usually hardcode them or use a build step. For specific VAPID capability, just init is usually enough.
// However, the senderId needs to match.
// Based on firebase.ts source:
// messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
// I should inspect firebase.ts again or check if can read env. Service workers can't read 'import.meta.env'.
// I will attempt to read from firebase config if available or use a generic init if possible.
// Actually, I can just initialize with the full config if I knew it.
// BUT, often just `firebase.initializeApp(config);` is needed.
// IMPORTANT: The user did NOT provide the Messaging Sender ID in the prompt, only the VAPID key.
// I'll need to check `firebase.ts` again to see what variables are used, or ask user?
// Wait, `firebase.ts` used `VITE_FIREBASE_MESSAGING_SENDER_ID`.
// I'll assume standard setup. 

// NOTE: Since I cannot see the ENV variables directly, I will add a placeholder structure.
// However, for this to work, I need the config.
// I will try to extract the config from `firebase.ts` logic? No, it uses `import.meta.env`.
// I will check if there is a `.env` file I can read to populate this file correctly?
// If not, I will leave comments for the user.
// BUT the user just gave me a VAPID key. 

// Strategy:
// I will create the SW with placeholders and ask the user to fill it, OR I will try to read `.env` now.

// -------------------------------------------------------------------------------- //
// IMPORTANT: You must replace these placeholders with your Firebase Config values.   //
// You can find them in your Firebase Console > Project Settings > General           //
// or in your local .env file.                                                       //
// -------------------------------------------------------------------------------- //
firebase.initializeApp({
    apiKey: "AIzaSyAkJHpDURLir0cfxcCTAQTDpnwrRCJpayQ",
    authDomain: "project-logos-f6f12.firebaseapp.com",
    projectId: "project-logos-f6f12",
    storageBucket: "project-logos-f6f12.appspot.com",
    messagingSenderId: "480162583284",
    appId: "1:480162583284:web:5c766eb9bf9002698904a1"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
