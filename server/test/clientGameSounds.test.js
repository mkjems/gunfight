import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientGameSounds() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientGameSounds.ts'),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });
    const encoded = Buffer.from(transpiled.outputText).toString('base64');
    const module = await import('data:text/javascript;base64,' + encoded);

    return module.ClientGameSounds;
}

test('maps gameplay sound methods to sound effect names', async function () {
    const ClientGameSounds = await loadClientGameSounds();
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

test('maps obstacle ids to obstacle hit sounds', async function () {
    const ClientGameSounds = await loadClientGameSounds();
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
