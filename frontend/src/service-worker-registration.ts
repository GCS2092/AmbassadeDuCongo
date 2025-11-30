/**
 * Service Worker Registration
 * Handles PWA installation and updates
 */

import { Workbox } from 'workbox-window';

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // New service worker installed, prompt user to refresh
        if (confirm('Nouvelle version disponible ! Recharger maintenant ?')) {
          window.location.reload();
        }
      }
    });

    wb.addEventListener('waiting', () => {
      // Service worker is waiting, show update notification
      showUpdateNotification(wb);
    });

    wb.register();
  }
}

function showUpdateNotification(wb: Workbox) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-primary-500 text-white p-4 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <p class="font-medium mb-2">Nouvelle version disponible</p>
    <button id="update-btn" class="btn btn-secondary text-sm">Mettre à jour</button>
  `;
  
  document.body.appendChild(notification);
  
  document.getElementById('update-btn')?.addEventListener('click', () => {
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });
    wb.messageSkipWaiting();
  });
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission:', permission);
    });
  }
}

