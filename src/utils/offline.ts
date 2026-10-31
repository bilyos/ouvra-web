/** Efface les données gardées hors connexion par le service worker (à appeler à la déconnexion). */
export function clearOfflineData() {
  if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'logout' });
  }
}
