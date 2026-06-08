const CACHE_NAME = 'gunfight-v9';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/index.css',
    '/js/Config.js',
    '/js/requestAnimationFrame.js',
    '/js/InstallPrompt.js',
    '/js/KeysModel.js',
    '/js/NameEditor.js',
    '/js/Camera.js',
    '/js/TouchControls.js',
    '/js/Color.js',
    '/js/Pen.js',
    '/js/Scene.js',
    '/js/Obstacles.js',
    '/js/Controllable.js',
    '/js/Bullet.js',
    '/js/Bullets.js',
    '/js/Players.js',
    '/js/Collision.js',
    '/js/index.js',
    '/fonts/press_start/prstart.ttf',
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

self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache){
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(keys.map(function(key){
                if(key !== CACHE_NAME){
                    return caches.delete(key);
                }
            }));
        }).then(function(){
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event){
    const url = new URL(event.request.url);

    if(url.pathname.indexOf('/socket.io/') === 0 || event.request.method !== 'GET'){
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(cachedResponse){
            return cachedResponse || fetch(event.request);
        })
    );
});
