const CACHE_NAME = 'expense-tracker-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Install service worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate service workerself.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((response) => {
                return response || fetch(e.request)
                    .then((fetchRes) => {
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(e.request, fetchRes.clone());
                                return fetchRes;
                            });
                    })
                    .catch(() => {
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
