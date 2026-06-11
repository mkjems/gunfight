GF.SoundEffects = function () {
    var audioContext;
    var soundEffects = {
        gunshot: createSoundEffect('sounds/gunshot.m4a', 0.8, 5),
        emptyGun: createSoundEffect('sounds/empty-gun-shot.mp3', 0.8, 3),
        pain: createSoundEffect('sounds/pain.m4a', 0.8, 3),
        ricochet: createSoundEffect('sounds/ricochet.mp3', 0.7, 5),
        ready: createSoundEffect('sounds/ready.mp3', 0.8, 3),
        cactusHit: createSoundEffect('sounds/cactus-hit.m4a', 0.8, 3),
        wagonHit: createSoundEffect('sounds/wagon-hit.mp3', 0.8, 3)
    };

    bindWarmup();

    function createSoundEffect(src, volume, poolSize) {
        var sound = {
            src: src,
            buffer: null,
            fallbackPool: createFallbackAudioPool(src, volume, poolSize),
            loading: null,
            nextIndex: 0,
            volume: volume
        };

        loadSoundBuffer(sound);

        return sound;
    }

    function createFallbackAudioPool(src, volume, poolSize) {
        var pool = [];
        var i;

        for (i = 0; i < poolSize; i++) {
            pool.push(createAudioElement(src, volume));
        }

        return pool;
    }

    function createAudioElement(src, volume) {
        var audio = new Audio(src);

        audio.preload = 'auto';
        audio.volume = volume;
        audio.load();

        return audio;
    }

    function getAudioContext() {
        var AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        return audioContext;
    }

    function loadSoundBuffer(sound) {
        var context = getAudioContext();

        if (!context || !window.fetch || sound.loading) {
            return;
        }

        sound.loading = fetch(sound.src)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Could not load sound: ' + sound.src);
                }

                return response.arrayBuffer();
            })
            .then(function (arrayBuffer) {
                return decodeAudioBuffer(context, arrayBuffer);
            })
            .then(function (buffer) {
                sound.buffer = buffer;
            })
            .catch(function () {});
    }

    function decodeAudioBuffer(context, arrayBuffer) {
        return new Promise(function (resolve, reject) {
            var decodeResult = context.decodeAudioData(
                arrayBuffer,
                resolve,
                reject
            );

            if (decodeResult && decodeResult.then) {
                decodeResult.then(resolve).catch(reject);
            }
        });
    }

    function bindWarmup() {
        document.addEventListener('keydown', warm, {
            once: true,
            capture: true
        });
        document.addEventListener('pointerdown', warm, {
            once: true,
            capture: true
        });
    }

    function warm() {
        var context = getAudioContext();

        resumeAudioContext(context);

        Object.keys(soundEffects || {}).forEach(function (name) {
            loadSoundBuffer(soundEffects[name]);
            soundEffects[name].fallbackPool.forEach(warmAudioElement);
        });
    }

    function warmAudioElement(audio) {
        var warmupAudio = audio.cloneNode();
        var playRequest;

        warmupAudio.muted = true;
        warmupAudio.currentTime = 0;
        playRequest = warmupAudio.play();

        if (playRequest && playRequest.then) {
            playRequest
                .then(function () {
                    warmupAudio.pause();
                    warmupAudio.currentTime = 0;
                })
                .catch(function () {});
        } else {
            warmupAudio.pause();
            warmupAudio.currentTime = 0;
        }
    }

    function resumeAudioContext(context) {
        var resumeRequest;

        if (!context || context.state !== 'suspended' || !context.resume) {
            return;
        }

        resumeRequest = context.resume();

        if (resumeRequest && resumeRequest.catch) {
            resumeRequest.catch(function () {});
        }
    }

    function play(name) {
        var sound = soundEffects && soundEffects[name];
        var context;
        var source;
        var gain;

        if (!sound) {
            return;
        }

        context = getAudioContext();

        if (context && sound.buffer) {
            resumeAudioContext(context);

            source = context.createBufferSource();
            gain = context.createGain();
            source.buffer = sound.buffer;
            gain.gain.value = sound.volume;
            source.connect(gain);
            gain.connect(context.destination);
            source.start(0);
            return;
        }

        playFallback(sound);
    }

    function playFallback(sound) {
        var audio;
        var playRequest;

        if (!sound.fallbackPool.length) {
            return;
        }

        audio = sound.fallbackPool[sound.nextIndex];
        sound.nextIndex = (sound.nextIndex + 1) % sound.fallbackPool.length;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = sound.volume;
        playRequest = audio.play();

        if (playRequest && playRequest.catch) {
            playRequest.catch(function () {});
        }
    }

    function playObstacleHit(id) {
        if (id === 'wagon') {
            play('wagonHit');
            return;
        }

        if (id && id.indexOf('cactus:') === 0) {
            play('cactusHit');
        }
    }

    return {
        play: play,
        playObstacleHit: playObstacleHit
    };
};
