// Service Worker léger pour afficher l'état d'avancement du téléchargement vidéo
// dans la barre de notification / barre haute du téléphone et ramener sur le site au clic.

const EXPORT_NOTIFICATION_TAG = 'sanctuaire-video-export';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'CLEAR_EXPORT_NOTIFICATIONS') {
    event.waitUntil(
      self.registration
        .getNotifications({ tag: EXPORT_NOTIFICATION_TAG })
        .then((notifications) => {
          for (const n of notifications) {
            try {
              n.close();
            } catch {}
          }
        })
        .catch(() => {})
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  if (notification && notification.tag === EXPORT_NOTIFICATION_TAG) {
    // Keep or close notification cleanly depending on action
    if (event.action === 'dismiss') {
      notification.close();
      return;
    }
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
        return undefined;
      })
      .catch(() => {})
  );
});
