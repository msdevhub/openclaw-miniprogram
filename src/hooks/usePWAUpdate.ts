import { useEffect, useState } from 'react';

interface PWAUpdateState {
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Hook for detecting and handling PWA updates
 * Checks for service worker updates and provides methods to apply them
 */
export function usePWAUpdate() {
  const [updateState, setUpdateState] = useState<PWAUpdateState>({
    updateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    // Register service worker and listen for updates
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        registration = reg;

        // Check for updates on page load
        reg.update();

        // Check for updates every hour
        const updateInterval = setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        // Listen for new service worker waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              setUpdateState({
                updateAvailable: true,
                registration: reg,
              });
            }
          });
        });

        return () => clearInterval(updateInterval);
      })
      .catch(() => {
        // Service worker registration failed, ignore
      });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload page when new service worker takes control
      window.location.reload();
    });
  }, []);

  const applyUpdate = () => {
    if (updateState.registration?.waiting) {
      // Tell the waiting service worker to skip waiting and activate
      updateState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const dismissUpdate = () => {
    setUpdateState({
      updateAvailable: false,
      registration: null,
    });
  };

  return {
    updateAvailable: updateState.updateAvailable,
    applyUpdate,
    dismissUpdate,
  };
}
