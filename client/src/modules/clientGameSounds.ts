type SoundEffects = {
    play: (name: string) => void;
};

type GlobalWithSoundEffects = typeof globalThis & {
    GF?: {
        SoundEffects?: new () => SoundEffects;
    };
};

type ClientGameSoundsOptions = {
    soundEffects?: SoundEffects | null;
};

export function ClientGameSounds(options: ClientGameSoundsOptions = {}) {
    const SoundEffectsCtor = (globalThis as GlobalWithSoundEffects).GF
        ?.SoundEffects;
    const soundEffects =
        options.soundEffects ||
        (SoundEffectsCtor ? new SoundEffectsCtor() : null);

    function play(name: string) {
        if (soundEffects) {
            soundEffects.play(name);
        }
    }

    function playObstacleHit(id?: string | null) {
        if (id === 'wagon') {
            play('wagonHit');
            return;
        }

        if (id && id.indexOf('cactus:') === 0) {
            play('cactusHit');
        }
    }

    return {
        playEmptyGun() {
            play('emptyGun');
        },
        playGun() {
            play('gunshot');
        },
        playObstacleHit,
        playPain() {
            play('pain');
        },
        playReady() {
            play('ready');
        },
        playRicochet() {
            play('ricochet');
        }
    };
}
