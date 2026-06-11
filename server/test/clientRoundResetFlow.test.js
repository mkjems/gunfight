import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientRoundResetFlow() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting'
                }
            },
            Config: {
                player: {
                    lobbySlots: ['lobby-left', 'lobby-right'],
                    slots: ['left', 'right']
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientRoundResetFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientRoundResetFlow;
}

function createResetOptions(overrides = {}) {
    const calls = [];
    const options = {
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        isReadyToStart(model) {
            calls.push(['isReadyToStart', model && model.gameId]);

            return false;
        },
        model: {
            gameId: 'game-1'
        },
        players: {
            resetAll(options) {
                calls.push(['players.resetAll', options.slots]);
            }
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        roundData: {
            resetRoundFlags() {
                calls.push('roundData.resetRoundFlags');
            }
        },
        setRoundMessage(message) {
            calls.push(['setRoundMessage', message]);
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        socket: {
            emit(event) {
                calls.push(['socket.emit', event]);
            }
        },
        startRoundRitual(options) {
            calls.push(['startRoundRitual', options.resetScores]);
        },
        syncNameEditor() {
            calls.push('syncNameEditor');
        },
        timers: {
            clearMany(names) {
                calls.push(['timers.clearMany', names]);
            }
        }
    };

    return {
        calls,
        options: {
            ...options,
            ...overrides
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('resets a round into the next ritual when the model is ready', function () {
    const flow = loadClientRoundResetFlow();
    const { calls, options } = createResetOptions({
        isReadyToStart(model) {
            calls.push(['isReadyToStart', model.gameId]);

            return true;
        }
    });

    flow.resetRound(options);

    assert.deepEqual(plain(calls), [
        ['isReadyToStart', 'game-1'],
        ['players.resetAll', ['left', 'right']],
        'bullets.reset',
        ['setRoundMessage', ''],
        'roundData.resetRoundFlags',
        ['timers.clearMany', ['reset', 'matchEnd']],
        ['startRoundRitual', false]
    ]);
});

test('resets a round back to waiting when the model is not ready', function () {
    const flow = loadClientRoundResetFlow();
    const { calls, options } = createResetOptions();

    flow.resetRound(options);

    assert.deepEqual(plain(calls), [
        ['isReadyToStart', 'game-1'],
        ['players.resetAll', ['lobby-left', 'lobby-right']],
        'bullets.reset',
        ['setRoundMessage', ''],
        'roundData.resetRoundFlags',
        ['timers.clearMany', ['reset', 'matchEnd']],
        ['setRoundState', 'waiting'],
        'syncNameEditor',
        'renderHud'
    ]);
});

test('resets the game over screen back to the lobby start screen', function () {
    const flow = loadClientRoundResetFlow();
    const { calls, options } = createResetOptions();

    flow.resetToStartScreen(options);

    assert.deepEqual(plain(calls), [
        ['players.resetAll', ['lobby-left', 'lobby-right']],
        'bullets.reset',
        ['setRoundMessage', ''],
        'roundData.resetRoundFlags',
        ['timers.clearMany', ['reset', 'matchEnd']],
        'resetAmmo',
        ['setRoundState', 'waiting'],
        'syncNameEditor',
        'renderHud',
        ['socket.emit', 'resetReady']
    ]);
});
