import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientGameSounds() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientGameSounds.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientGameSounds;
}

test('maps gameplay sound methods to sound effect names', function () {
    const ClientGameSounds = loadClientGameSounds();
    const played = [];
    const sounds = new ClientGameSounds({
        soundEffects: {
            play(name) {
                played.push(name);
            }
        }
    });

    sounds.playGun();
    sounds.playEmptyGun();
    sounds.playRicochet();
    sounds.playPain();
    sounds.playReady();

    assert.deepEqual(played, [
        'gunshot',
        'emptyGun',
        'ricochet',
        'pain',
        'ready'
    ]);
});

test('maps obstacle ids to obstacle hit sounds', function () {
    const ClientGameSounds = loadClientGameSounds();
    const played = [];
    const sounds = new ClientGameSounds({
        soundEffects: {
            play(name) {
                played.push(name);
            }
        }
    });

    sounds.playObstacleHit('wagon');
    sounds.playObstacleHit('cactus:2');
    sounds.playObstacleHit('rock');

    assert.deepEqual(played, ['wagonHit', 'cactusHit']);
});
