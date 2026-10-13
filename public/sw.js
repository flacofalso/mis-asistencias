// Permite abrir la app sin señal: guarda una copia de lo que se va cargando
// y la usa cuando no hay conexión.
const CACHE = 'asistencias-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copia = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copia))
        return res
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('./'))),
  )
})
