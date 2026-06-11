import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientRoundRitual() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    PLAYING: 'playing',
                    RITUAL: 'ritual'
                }
            },
            Config: {
                game: {
                    seconds: 70
                },
                round: {
                    drawDelay: 700,
                    getReadyDelay: 1200,
                    introWalkDelay: 1500
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientRoundRitual.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientRoundRitual;
}

function createOptions() {
    const calls = [];
    const scheduled = [];
    const options = {
        bullets: {
            reset() {
                calls.push('bullets.reset');
            }
        },
        calls,
        closeNameEditor() {
            calls.push('closeNameEditor');
        },
        endGame() {
            calls.push('endGame');
        },
        hasMatchTimeExpired() {
            return false;
        },
        renderHud() {
            calls.push('renderHud');
        },
        resetAmmo() {
            calls.push('resetAmmo');
        },
        resetScores: true,
        roundData: {
            clearObstacleDamage() {
                calls.push('roundData.clearObstacleDamage');
            },
            clearRoundEnd() {
                calls.push('roundData.clearRoundEnd');
            },
            getRoundEndsAt() {
                return null;
            },
            setRoundEndsAt(value) {
                calls.push(['roundData.setRoundEndsAt', typeof value]);
            },
            startScenario() {
                calls.push('roundData.startScenario');
            }
        },
        roundIntro: {
            complete() {
                calls.push('roundIntro.complete');
            },
            start() {
                calls.push('roundIntro.start');
            }
        },
        scheduleMatchEnd() {
            calls.push('scheduleMatchEnd');
        },
        scoreKeeper: {
            resetScores() {
                calls.push('scoreKeeper.resetScores');
            }
        },
        setRoundMessage(message) {
            calls.push(['setRoundMessage', message]);
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        timers: {
            set(name, callback, delay) {
                scheduled.push({ callback, delay, name });
                calls.push(['timer.set', name, delay]);
            }
        }
    };

    return { calls, options, scheduled };
}

test('starts the get-ready ritual and schedules draw', function () {
    const ritual = loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);

    assert.deepEqual(calls, [
        'scoreKeeper.resetScores',
        'roundData.clearRoundEnd',
        ['setRoundState', 'ritual'],
        'closeNameEditor',
        'roundData.startScenario',
        'roundData.clearObstacleDamage',
        'bullets.reset',
        'resetAmmo',
        'roundIntro.start',
        ['setRoundMessage', 'GET READY'],
        'renderHud',
        ['timer.set', 'ritual', 1500]
    ]);
    assert.equal(scheduled.length, 1);
});

test('moves from draw to playing after ritual timers', function () {
    const ritual = loadClientRoundRitual();
    const { calls, options, scheduled } = createOptions();

    ritual.start(options);
    scheduled[0].callback();
    scheduled[1].callback();

    assert.deepEqual(calls.slice(12), [
        'roundIntro.complete',
        ['setRoundMessage', 'DRAW!'],
        ['timer.set', 'ritual', 700],
        ['setRoundMessage', ''],
        ['roundData.setRoundEndsAt', 'number'],
        'scheduleMatchEnd',
        'resetAmmo',
        ['setRoundState', 'playing'],
        'renderHud'
    ]);
});
