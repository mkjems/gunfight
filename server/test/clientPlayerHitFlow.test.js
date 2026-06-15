import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadClientPlayerHitFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientPlayerHitFlow.ts',
        'flows/clientPlayerHitFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientPlayerHitFlow.js'))
            .href
    );

    return module.ClientPlayerHitFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('handles player hits by entering hit pause and scheduling reset', async function () {
    const flow = await loadClientPlayerHitFlow();
    const calls = [];

    flow.handleHit({
        bullets: {
            clear() {
                calls.push('bullets.clear');
            }
        },
        hit: {
            targetId: 'p2',
            winnerId: 'p1'
        },
        model: {
            roundNumber: 4
        },
        playerId: 'p1',
        players: {
            all: {
                p2: {
                    playDeathAnimation() {
                        calls.push('target.playDeathAnimation');
                    }
                }
            },
            clearKeys() {
                calls.push('players.clearKeys');
            }
        },
        playPain() {
            calls.push('playPain');
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAfterHit() {},
        roundData: {
            setHitMessage(message) {
                calls.push(['roundData.setHitMessage', message]);
            }
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        socket: {
            emit(event, payload) {
                calls.push([
                    'socket.emit',
                    event,
                    payload.roundNumber,
                    payload.winnerId,
                    payload.targetId
                ]);
            }
        },
        timers: {
            set(name, callback, delay) {
                calls.push(['timers.set', name, typeof callback, delay]);
            }
        }
    });

    assert.deepEqual(plain(calls), [
        ['setRoundState', 'hitPause'],
        [
            'roundData.setHitMessage',
            {
                targetId: 'p2',
                text: 'Got me!'
            }
        ],
        'playPain',
        'target.playDeathAnimation',
        ['socket.emit', 'roundResult', 4, 'p1', 'p2'],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.set', 'hit', 'function', 1800]
    ]);
});

test('resets after hit and starts the next ritual', async function () {
    const flow = await loadClientPlayerHitFlow();
    const calls = [];

    flow.resetAfterHit({
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        endGame() {
            calls.push('endGame');
        },
        hasMatchTimeExpired() {
            return false;
        },
        players: {
            all: {
                p1: {
                    clearDeathAnimation() {
                        calls.push('p1.clearDeathAnimation');
                    }
                }
            }
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            clearHitMessage() {
                calls.push('roundData.clearHitMessage');
            }
        },
        startRoundRitual(options) {
            calls.push(['startRoundRitual', options.resetScores]);
        }
    });

    assert.deepEqual(calls, [
        'roundData.clearHitMessage',
        'p1.clearDeathAnimation',
        'bullets.reset',
        'resetAmmo',
        ['startRoundRitual', false]
    ]);
});

test('resets after remote hit without advancing the round locally', async function () {
    const flow = await loadClientPlayerHitFlow();
    const calls = [];

    flow.resetAfterHit({
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        endGame() {
            calls.push('endGame');
        },
        hasMatchTimeExpired() {
            return false;
        },
        players: {
            all: {
                p1: {
                    clearDeathAnimation() {
                        calls.push('p1.clearDeathAnimation');
                    }
                },
                p2: {
                    clearDeathAnimation() {
                        calls.push('p2.clearDeathAnimation');
                    }
                }
            }
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            clearHitMessage() {
                calls.push('roundData.clearHitMessage');
            }
        },
        socket: {
            emit(event) {
                calls.push(['socket.emit', event]);
            }
        },
        startRoundRitual(options) {
            calls.push(['startRoundRitual', options.resetScores]);
        }
    });

    assert.deepEqual(calls, [
        'roundData.clearHitMessage',
        'p1.clearDeathAnimation',
        'p2.clearDeathAnimation',
        'bullets.reset',
        'resetAmmo',
        ['startRoundRitual', false]
    ]);
});

test('ends the game after hit pause if match time expired', async function () {
    const flow = await loadClientPlayerHitFlow();
    const calls = [];

    flow.resetAfterHit({
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        endGame() {
            calls.push('endGame');
        },
        hasMatchTimeExpired() {
            return true;
        },
        players: {
            all: {}
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            clearHitMessage() {
                calls.push('roundData.clearHitMessage');
            }
        },
        socket: {
            emit() {
                calls.push('socket.emit');
            }
        },
        startRoundRitual() {
            calls.push('startRoundRitual');
        }
    });

    assert.deepEqual(calls, ['roundData.clearHitMessage', 'endGame']);
});
