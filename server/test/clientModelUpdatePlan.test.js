import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientModelUpdatePlan() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            },
            Config: {
                player: {
                    lobbySlots: [{ x: 1 }],
                    slots: [{ x: 2 }]
                }
            }
        }
    };
    const modelSyncSource = readFileSync(
        new URL('../../client/js/ClientModelSync.js', import.meta.url),
        'utf8'
    );
    const planSource = readFileSync(
        new URL('../../client/js/ClientModelUpdatePlan.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(modelSyncSource, context);
    vm.runInNewContext(planSource, context);

    return context.GF.ClientModelUpdatePlan;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('plans a round start when a waiting game becomes ready', function () {
    const plan = loadClientModelUpdatePlan();
    const previousModel = {
        clients: [
            { id: 'p1', ready: false },
            { id: 'p2', ready: false }
        ]
    };
    const model = {
        clients: [
            { id: 'p1', ready: true },
            { id: 'p2', ready: true }
        ],
        status: 'playing'
    };

    assert.deepEqual(
        plain(
            plan.create({
                model,
                playerId: 'p1',
                previousModel,
                roundState: 'waiting'
            })
        ),
        {
            clearAbandonedRequeue: true,
            clearLocalReadyRequest: false,
            enterLobbyState: false,
            playReadySound: true,
            renderHud: false,
            scheduleAbandonedRequeue: false,
            startRoundRitual: true,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: true,
                slots: [{ x: 1 }]
            }
        }
    );
});

test('plans abandoned-game recovery', function () {
    const plan = loadClientModelUpdatePlan();

    assert.deepEqual(
        plain(
            plan.create({
                model: {
                    clients: [{ id: 'p1', ready: false }],
                    status: 'abandoned'
                },
                playerId: 'p1',
                previousModel: null,
                roundState: 'playing'
            })
        ),
        {
            clearAbandonedRequeue: false,
            clearLocalReadyRequest: true,
            enterLobbyState: true,
            playReadySound: false,
            renderHud: true,
            scheduleAbandonedRequeue: true,
            startRoundRitual: false,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: false,
                slots: [{ x: 2 }]
            }
        }
    );
});
