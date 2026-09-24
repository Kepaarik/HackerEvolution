/**
 * Регистрация Service Worker (Этап 1: PWA).
 * В dev-режиме SW не регистрируется (vite-plugin-pwa подключает его только в preview/prod).
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.info('[PWA] Service Worker зарегистрирован, scope:', reg.scope)
        })
        .catch((err) => {
          console.warn('[PWA] Не удалось зарегистрировать Service Worker:', err)
        })
    })
  }
}
