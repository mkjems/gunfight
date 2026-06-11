import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

async function loadClientModelSync() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientModelSync.ts'),
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

    return module.ClientModelSync;
}

async function loadClientModelUpdatePlan() {
    const context = {
        GF: {
            ClientModelSync: await loadClientModelSync(),
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
    const planSource = readFileSync(
        new URL('../../client/js/ClientModelUpdatePlan.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(planSource, context);

    return context.GF.ClientModelUpdatePlan;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('plans a round start when a waiting game becomes ready', async function () {
    const plan = await loadClientModelUpdatePlan();
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

test('plans abandoned-game recovery', async function () {
    const plan = await loadClientModelUpdatePlan();

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
