import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientPlayerHitFlow() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    HIT_PAUSE: 'hitPause'
                }
            },
            Config: {
                round: {
                    resetDelay: 1800
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientPlayerHitFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientPlayerHitFlow;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('handles player hits by entering hit pause and scheduling reset', function () {
    const flow = loadClientPlayerHitFlow();
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
            setAdvanceRoundAfterHit(value) {
                calls.push(['roundData.setAdvanceRoundAfterHit', value]);
            },
            setHitMessage(message) {
                calls.push(['roundData.setHitMessage', message]);
            }
        },
        scoreKeeper: {
            addPoint(slot) {
                calls.push(['scoreKeeper.addPoint', slot]);
            }
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        timers: {
            set(name, callback, delay) {
                calls.push(['timers.set', name, typeof callback, delay]);
            }
        },
        winnerSlot: 0
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
        ['scoreKeeper.addPoint', 0],
        ['roundData.setAdvanceRoundAfterHit', true],
        'renderHud',
        'players.clearKeys',
        'bullets.clear',
        ['timers.set', 'hit', 'function', 1800]
    ]);
});

test('resets after hit and emits advance-round when local player won', function () {
    const flow = loadClientPlayerHitFlow();
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
            },
            consumeAdvanceRoundAfterHit() {
                return true;
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
        ['socket.emit', 'advanceRound'],
        'bullets.reset',
        'resetAmmo',
        ['startRoundRitual', false]
    ]);
});

test('ends the game after hit pause if match time expired', function () {
    const flow = loadClientPlayerHitFlow();
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
