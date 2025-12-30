import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './core/state/AuthContext'
import { AudioProvider } from './core/state/AudioContext'
import { ThemeProvider } from './core/state/ThemeContext'
import { BibleProvider } from './core/state/BibleContext'
import { ToastProvider } from './core/state/ToastContext'
import { PostQueueProvider } from './core/state/PostQueueContext'
import { NotificationProvider } from './core/state/NotificationContext'
// import { registerSW } from 'virtual:pwa-register'

// iOS PWA Viewport Height Fix
// We use --app-h to track the actual visible height, avoiding address bar issues.
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

function setAppHeight() {
  const doc = document.documentElement;
  // Prefer visualViewport for most accurate height primarily on iOS
  // Fallback to innerHeight for environments without visualViewport
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  doc.style.setProperty('--app-h', `${h}px`);
}

function setAppHeightDebounced() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(setAppHeight, 50);
}

// Apply immediately and on resize/orientation change
// Apply immediately and on resize/orientation change
// setAppHeight();
// window.addEventListener('resize', setAppHeight);
// window.addEventListener('orientationchange', () => {
//   setTimeout(setAppHeight, 100);
// });

// if (window.visualViewport) {
//   window.visualViewport.addEventListener('resize', setAppHeight);
//   // Enable scroll listener to handle address bar appearance/disappearance
//   window.visualViewport.addEventListener('scroll', setAppHeightDebounced);
// }

// Temporary Seeding
// import { seedKeyBooks } from './utils/seedBible'
// seedKeyBooks().then(() => console.log("Seeding triggered"));

// Register service worker with auto-update
// SW DISABLED BY USER REQUEST
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      console.log('Unregistering SW:', registration.scope);
      registration.unregister();
    }
  });
}

// const updateSW = registerSW({ ... })

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <AudioProvider>
          <ToastProvider>
            <PostQueueProvider>
              <NotificationProvider>
                <BibleProvider>
                  <App />
                </BibleProvider>
              </NotificationProvider>
            </PostQueueProvider>
          </ToastProvider>
        </AudioProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)
