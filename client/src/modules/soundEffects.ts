type AudioElementLike = {
    cloneNode: () => AudioElementLike;
    currentTime: number;
    load: () => void;
    muted: boolean;
    pause: () => void;
    play: () => Promise<unknown> | void;
    preload: string;
    volume: number;
};

type AudioConstructorLike = new (src: string) => AudioElementLike;

type AudioContextLike = {
    createBufferSource: () => {
        buffer?: unknown;
        connect: (node: unknown) => void;
        start: (when: number) => void;
    };
    createGain: () => {
        connect: (node: unknown) => void;
        gain: {
            value: number;
        };
    };
    decodeAudioData: (
        arrayBuffer: ArrayBuffer,
        resolve: (buffer: unknown) => void,
        reject: (err: unknown) => void
    ) => Promise<unknown> | void;
    destination: unknown;
    resume?: () => Promise<unknown> | void;
    state?: string;
};

type AudioContextConstructorLike = new () => AudioContextLike;

type DocumentLike = {
    addEventListener: (
        eventName: string,
        callback: () => void,
        options?: {
            capture?: boolean;
            once?: boolean;
        }
    ) => void;
};

type FetchResponseLike = {
    arrayBuffer: () => Promise<ArrayBuffer>;
    ok: boolean;
};

type WindowLike = {
    AudioContext?: AudioContextConstructorLike;
    fetch?: (src: string) => Promise<FetchResponseLike>;
    webkitAudioContext?: AudioContextConstructorLike;
};

type SoundEffect = {
    buffer: unknown;
    fallbackPool: AudioElementLike[];
    loading: Promise<unknown> | null;
    nextIndex: number;
    src: string;
    volume: number;
};

type SoundEffectsOptions = {
    Audio?: AudioConstructorLike;
    document?: DocumentLike;
    window?: WindowLike;
};

export class SoundEffects {
    audioContext?: AudioContextLike;
    AudioConstructor: AudioConstructorLike;
    ownerDocument: DocumentLike;
    ownerWindow: WindowLike;
    soundEffects: Record<string, SoundEffect>;

    constructor(options: SoundEffectsOptions = {}) {
        this.ownerWindow = (options.window || window) as unknown as WindowLike;
        this.ownerDocument = (options.document || document) as DocumentLike;
        this.AudioConstructor = (options.Audio ||
            Audio) as AudioConstructorLike;
        this.soundEffects = {
            gunshot: this.createSoundEffect('sounds/gunshot.m4a', 0.8, 5),
            emptyGun: this.createSoundEffect(
                'sounds/empty-gun-shot.mp3',
                0.8,
                3
            ),
            pain: this.createSoundEffect('sounds/pain.m4a', 0.8, 3),
            ricochet: this.createSoundEffect('sounds/ricochet.mp3', 0.7, 5),
            ready: this.createSoundEffect('sounds/ready.mp3', 0.8, 3),
            cactusHit: this.createSoundEffect('sounds/cactus-hit.m4a', 0.8, 3),
            wagonHit: this.createSoundEffect('sounds/wagon-hit.mp3', 0.8, 3)
        };

        this.bindWarmup();
    }

    createSoundEffect(src: string, volume: number, poolSize: number) {
        const sound: SoundEffect = {
            src,
            buffer: null,
            fallbackPool: this.createFallbackAudioPool(src, volume, poolSize),
            loading: null,
            nextIndex: 0,
            volume
        };

        this.loadSoundBuffer(sound);

        return sound;
    }

    createFallbackAudioPool(src: string, volume: number, poolSize: number) {
        const pool: AudioElementLike[] = [];

        for (let i = 0; i < poolSize; i += 1) {
            pool.push(this.createAudioElement(src, volume));
        }

        return pool;
    }

    createAudioElement(src: string, volume: number) {
        const audio = new this.AudioConstructor(src);

        audio.preload = 'auto';
        audio.volume = volume;
        audio.load();

        return audio;
    }

    getAudioContext() {
        const AudioContextClass =
            this.ownerWindow.AudioContext ||
            this.ownerWindow.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContextClass();
        }

        return this.audioContext;
    }

    loadSoundBuffer(sound: SoundEffect) {
        const context = this.getAudioContext();

        if (!context || !this.ownerWindow.fetch || sound.loading) {
            return;
        }

        sound.loading = this.ownerWindow
            .fetch(sound.src)
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

    bindWarmup() {
        this.ownerDocument.addEventListener('keydown', this.warm.bind(this), {
            once: true,
            capture: true
        });
        this.ownerDocument.addEventListener(
            'pointerdown',
            this.warm.bind(this),
            {
                once: true,
                capture: true
            }
        );
    }

    warm() {
        const context = this.getAudioContext();

        this.resumeAudioContext(context);

        Object.keys(this.soundEffects || {}).forEach((name) => {
            this.loadSoundBuffer(this.soundEffects[name]);
            this.soundEffects[name].fallbackPool.forEach((audio) => {
                this.warmAudioElement(audio);
            });
        });
    }

    warmAudioElement(audio: AudioElementLike) {
        const warmupAudio = audio.cloneNode();

        warmupAudio.muted = true;
        warmupAudio.currentTime = 0;
        const playRequest = warmupAudio.play();

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

    resumeAudioContext(context: AudioContextLike | null | undefined) {
        if (!context || context.state !== 'suspended' || !context.resume) {
            return;
        }

        const resumeRequest = context.resume();

        if (resumeRequest && resumeRequest.catch) {
            resumeRequest.catch(function () {});
        }
    }

    play(name: string) {
        const sound = this.soundEffects && this.soundEffects[name];

        if (!sound) {
            return;
        }

        const context = this.getAudioContext();

        if (context && sound.buffer) {
            this.resumeAudioContext(context);

            const source = context.createBufferSource();
            const gain = context.createGain();
            source.buffer = sound.buffer;
            gain.gain.value = sound.volume;
            source.connect(gain);
            gain.connect(context.destination);
            source.start(0);
            return;
        }

        this.playFallback(sound);
    }

    playFallback(sound: SoundEffect) {
        if (!sound.fallbackPool.length) {
            return;
        }

        const audio = sound.fallbackPool[sound.nextIndex];
        sound.nextIndex = (sound.nextIndex + 1) % sound.fallbackPool.length;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = sound.volume;
        const playRequest = audio.play();

        if (playRequest && playRequest.catch) {
            playRequest.catch(function () {});
        }
    }

    playObstacleHit(id: string) {
        if (id === 'wagon') {
            this.play('wagonHit');
            return;
        }

        if (id && id.indexOf('cactus:') === 0) {
            this.play('cactusHit');
        }
    }
}

function decodeAudioBuffer(
    context: AudioContextLike,
    arrayBuffer: ArrayBuffer
) {
    return new Promise(function (resolve, reject) {
        const decodeResult = context.decodeAudioData(
            arrayBuffer,
            resolve,
            reject
        );

        if (decodeResult && decodeResult.then) {
            decodeResult.then(resolve).catch(reject);
        }
    });
}
