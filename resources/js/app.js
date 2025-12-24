import './bootstrap';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);

                // Check for updates silently - no popup
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available - auto reload without asking
                            // Use sessionStorage to prevent reload loop
                            const lastReload = sessionStorage.getItem('sw-reload-time');
                            const now = Date.now();

                            // Only reload if not reloaded in the last 10 seconds
                            if (!lastReload || (now - parseInt(lastReload)) > 10000) {
                                sessionStorage.setItem('sw-reload-time', now.toString());
                                console.log('New SW version available, reloading...');
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}


// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button or prompt
    showInstallPrompt();
});

function showInstallPrompt() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }

    // Check if prompt was dismissed recently (within 24 hours)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) {
        return;
    }

    // Create install prompt element
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
        <p>📱 Install app?</p>
        <button class="install-btn" onclick="installApp()">Install</button>
        <button class="close-btn" onclick="dismissInstallPrompt(this.parentElement)">✕</button>
    `;

    document.body.appendChild(prompt);

    // Auto hide after 8 seconds
    setTimeout(() => {
        if (prompt.parentElement) {
            prompt.remove();
        }
    }, 8000);
}

window.dismissInstallPrompt = function (element) {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    element.remove();
};

window.installApp = async function () {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        deferredPrompt = null;

        // Remove prompt
        document.querySelector('.install-prompt')?.remove();
    }
};

// Online/Offline status indicator
window.addEventListener('online', () => {
    showToast('Koneksi internet tersambung', 'success');
    // Trigger background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(sw => {
            sw.sync.register('sync-rentals');
        });
    }
});

window.addEventListener('offline', () => {
    showToast('Anda sedang offline. Data akan disinkronkan saat online.', 'error');
});

// IndexedDB helper for offline data
const DB_NAME = 'RentalAppDB';
const DB_VERSION = 1;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('pendingRentals')) {
                db.createObjectStore('pendingRentals', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('cachedItems')) {
                db.createObjectStore('cachedItems', { keyPath: 'code' });
            }
        };
    });
}

// Cache item data for offline use
window.cacheItemData = async function (item) {
    const db = await openDatabase();
    const tx = db.transaction('cachedItems', 'readwrite');
    tx.objectStore('cachedItems').put(item);
};

// Get cached item
window.getCachedItem = async function (code) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('cachedItems', 'readonly');
        const request = tx.objectStore('cachedItems').get(code);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Save rental for offline sync
window.savePendingRental = async function (rentalData) {
    const db = await openDatabase();
    const tx = db.transaction('pendingRentals', 'readwrite');
    tx.objectStore('pendingRentals').add(rentalData);
};
