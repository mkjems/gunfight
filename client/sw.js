const CACHE_NAME = 'gunfight-v17';
const LOCAL_DEVELOPMENT_HOSTS = ['localhost', '127.0.0.1'];
const IS_LOCAL_DEVELOPMENT =
    LOCAL_DEVELOPMENT_HOSTS.indexOf(self.location.hostname) >= 0;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/index.css',
    '/assets/client.js',
    '/assets/RotatePlease.png',
    '/assets/favicon.ico?v=gunfight-v1',
    '/assets/manifest.webmanifest',
    '/fonts/PressStartK.woff2',
    '/fonts/Arcade.woff2',
    '/fonts/ARCADE.TTF',
    '/fonts/GameOver.woff2',
    '/fonts/GamePocket-Regular.woff2',
    '/fonts/DucoilSans-Regular.woff2',
    '/fonts/ProggySquareTT.woff2',
    '/images/bullet.png',
    '/images/cactus-1-4-17X32.png',
    '/images/gunfight_player_spritesheet.png',
    '/images/rock-pattern.png',
    '/images/saloon-64x128.png',
    '/images/wagon-1-4-37x38.png',
    '/sounds/ready.mp3',
    '/sounds/gunshot.m4a',
    '/sounds/empty-gun-shot.mp3',
    '/sounds/pain.m4a',
    '/sounds/ricochet.mp3',
    '/sounds/cactus-hit.m4a',
    '/sounds/wagon-hit.mp3',
    '/favicon.ico',
    '/manifest.webmanifest'
];

self.addEventListener('install', function (event) {
    if (IS_LOCAL_DEVELOPMENT) {
        self.skipWaiting();
        return;
    }

    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches
            .keys()
            .then(function (keys) {
                return Promise.all(
                    keys.map(function (key) {
                        if (IS_LOCAL_DEVELOPMENT || key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', function (event) {
    if (IS_LOCAL_DEVELOPMENT) {
        return;
    }

    const url = new URL(event.request.url);

    if (
        url.pathname.indexOf('/socket.io/') === 0 ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            return cachedResponse || fetch(event.request);
        })
    );
});
