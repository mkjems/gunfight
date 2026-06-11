import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientLobbyFlow() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    WAITING: 'waiting'
                }
            },
            Config: {
                round: {
                    abandonedRequeueDelay: 3000
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientLobbyFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientLobbyFlow;
}

function createLobbyOptions(overrides = {}) {
    const calls = [];
    const options = {
        bullets: {
            clear() {
                calls.push('bullets.clear');
            }
        },
        players: {
            clearKeys() {
                calls.push('players.clearKeys');
            }
        },
        roundData: {
            resetRoundFlags() {
                calls.push('roundData.resetRoundFlags');
            }
        },
        roundIntro: {
            clear() {
                calls.push('roundIntro.clear');
            }
        },
        scoreKeeper: {
            resetRecordedResult() {
                calls.push('scoreKeeper.resetRecordedResult');
            }
        },
        setRoundState(state) {
            calls.push(['setRoundState', state]);
        },
        socket: {
            emit(event) {
                calls.push(['socket.emit', event]);
            }
        },
        syncNameEditor() {
            calls.push('syncNameEditor');
        },
        timers: {
            clear(name) {
                calls.push(['timers.clear', name]);
            },
            clearMany(names) {
                calls.push(['timers.clearMany', names]);
            },
            has() {
                return false;
            },
            set(name, callback, delay) {
                calls.push(['timers.set', name, typeof callback, delay]);
                callback();
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

test('enters lobby state by clearing round activity and sync state', function () {
    const flow = loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    flow.enter(options);

    assert.deepEqual(plain(calls), [
        ['timers.clearMany', ['ritual', 'hit', 'reset', 'abandonedRequeue']],
        'roundIntro.clear',
        'roundData.resetRoundFlags',
        ['setRoundState', 'waiting'],
        'scoreKeeper.resetRecordedResult',
        'players.clearKeys',
        'bullets.clear',
        'syncNameEditor'
    ]);
});

test('schedules abandoned game requeue once', function () {
    const flow = loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    assert.equal(flow.scheduleAbandonedRequeue(options), true);
    assert.deepEqual(plain(calls), [
        ['timers.set', 'abandonedRequeue', 'function', 3000],
        ['socket.emit', 'requeue']
    ]);
});

test('does not schedule abandoned game requeue without socket or when pending', function () {
    const flow = loadClientLobbyFlow();
    const withoutSocket = createLobbyOptions({
        socket: null
    });
    const alreadyPending = createLobbyOptions({
        timers: {
            has() {
                return true;
            },
            set() {
                alreadyPending.calls.push('timers.set');
            }
        }
    });

    assert.equal(flow.scheduleAbandonedRequeue(withoutSocket.options), false);
    assert.equal(flow.scheduleAbandonedRequeue(alreadyPending.options), false);
    assert.deepEqual(withoutSocket.calls, []);
    assert.deepEqual(alreadyPending.calls, []);
});

test('clears abandoned game requeue timer', function () {
    const flow = loadClientLobbyFlow();
    const { calls, options } = createLobbyOptions();

    flow.clearAbandonedRequeue(options);

    assert.deepEqual(calls, [['timers.clear', 'abandonedRequeue']]);
});
