const CACHE_PREFIX = 'gunfight-';

function deleteGunfightCaches() {
    return caches.keys().then(function (keys) {
        return Promise.all(
            keys
                .filter(function (key) {
                    return key.indexOf(CACHE_PREFIX) === 0;
                })
                .map(function (key) {
                    return caches.delete(key);
                })
        );
    });
}

self.addEventListener('install', function (event) {
    event.waitUntil(
        deleteGunfightCaches().then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        deleteGunfightCaches().then(function () {
            return self.clients.claim();
        })
    );
});

// Intentionally no runtime caching. The service worker stays registered only so
// older cache-first workers can be replaced and their stale caches deleted.
self.addEventListener('fetch', function () {});
