import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { BibleProvider } from './contexts/BibleContext'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically update when a new version is available
    console.log('[PWA] New content available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline');
  },
  onRegisteredSW(swUrl, r) {
    // Check for updates every 60 seconds
    if (r) {
      setInterval(() => {
        r.update();
      }, 60 * 1000);
    }
    console.log('[PWA] Service worker registered:', swUrl);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AudioProvider>
          <BibleProvider>
            <App />
          </BibleProvider>
        </AudioProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)

