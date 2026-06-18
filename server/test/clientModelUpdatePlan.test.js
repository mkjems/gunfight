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

async function loadClientModelUpdatePlan() {
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
        'network/clientModelSync.ts',
        'network/clientModelSync.js',
        tempDirectory
    );
    compileClientModule(
        'network/clientModelUpdatePlan.ts',
        'network/clientModelUpdatePlan.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(
            path.join(tempDirectory, 'network/clientModelUpdatePlan.js')
        ).href
    );

    return module.ClientModelUpdatePlan;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('does not start a round from ready flags without server round intro', async function () {
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
        currentScenario: {
            playerStarts: [
                { x: 120, y: 430, facing: 1, frame: 0 },
                { x: 830, y: 430, facing: -1, frame: 2 }
            ]
        }
    };

    const result = plan.create({
        model,
        playerId: 'p1',
        previousModel,
        roundState: 'waiting'
    });

    assert.equal(result.startRoundRitual, false);
    assert.equal(result.renderHud, true);
});

test('plans a round start when the server enters round intro', async function () {
    const plan = await loadClientModelUpdatePlan();
    const previousModel = {
        clients: [
            { id: 'p1', ready: true },
            { id: 'p2', ready: true }
        ],
        phase: 'hitPause'
    };
    const model = {
        clients: [
            { id: 'p1', ready: true },
            { id: 'p2', ready: true }
        ],
        currentScenario: {
            playerStarts: [
                { x: 120, y: 430, facing: 1, frame: 0 },
                { x: 830, y: 430, facing: -1, frame: 2 }
            ]
        },
        phase: 'roundIntro',
        roundNumber: 3
    };

    assert.deepEqual(
        plain(
            plan.create({
                model,
                playerId: 'p1',
                previousModel,
                roundState: 'hitPause'
            })
        ),
        {
            clearAbandonedRequeue: true,
            clearLocalReadyRequest: false,
            enterGameOverState: false,
            enterLobbyState: false,
            playReadySound: false,
            renderHud: false,
            scheduleAbandonedRequeue: false,
            startRoundRitual: true,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: false,
                roundNumber: 3,
                showStraightnessMeter: true,
                slots: [
                    { x: 120, y: 430, facing: 1, frame: 0 },
                    { x: 830, y: 430, facing: -1, frame: 2 }
                ]
            }
        }
    );
});

test('does not start gameplay while the server is in ready countdown', async function () {
    const plan = await loadClientModelUpdatePlan();

    assert.equal(
        plan.create({
            model: {
                clients: [
                    { id: 'p1', ready: true },
                    { id: 'p2', ready: true }
                ],
                phase: 'readyCountdown'
            },
            playerId: 'p1',
            previousModel: {
                clients: [
                    { id: 'p1', ready: true },
                    { id: 'p2', ready: false }
                ],
                phase: 'readying'
            },
            roundState: 'waiting'
        }).startRoundRitual,
        false
    );
});

test('plans slot-ordered lobby slots while waiting in the lobby', async function () {
    const plan = await loadClientModelUpdatePlan();
    const model = {
        clients: [
            { id: 'p1', ready: false },
            { id: 'p2', ready: false }
        ],
        phase: 'readying'
    };

    assert.deepEqual(
        plain(
            plan.create({
                model,
                playerId: 'p2',
                previousModel: null,
                roundState: 'waiting'
            }).syncPlayers
        ),
        {
            resetChangedSlots: true,
            showStraightnessMeter: false,
            slots: [
                {
                    x: 150,
                    y: 400,
                    facing: 1,
                    frame: 0,
                    movementBounds: {
                        minX: 106,
                        maxX: 310,
                        minY: 320,
                        maxY: 440
                    }
                },
                {
                    x: 800,
                    y: 400,
                    facing: -1,
                    frame: 2,
                    movementBounds: {
                        minX: 640,
                        maxX: 844,
                        minY: 320,
                        maxY: 440
                    }
                }
            ]
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
                    phase: 'abandoned'
                },
                playerId: 'p1',
                previousModel: null,
                roundState: 'playing'
            })
        ),
        {
            clearAbandonedRequeue: false,
            clearLocalReadyRequest: true,
            enterGameOverState: false,
            enterLobbyState: true,
            playReadySound: false,
            renderHud: true,
            scheduleAbandonedRequeue: true,
            startRoundRitual: false,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: false,
                showStraightnessMeter: false,
                slots: [
                    { x: 150, y: 430, facing: 1, frame: 0 },
                    { x: 800, y: 430, facing: -1, frame: 2 }
                ]
            }
        }
    );
});

test('plans lobby recovery when the server returns from game over', async function () {
    const plan = await loadClientModelUpdatePlan();

    assert.deepEqual(
        plain(
            plan.create({
                model: {
                    clients: [
                        { id: 'p1', ready: false },
                        { id: 'p2', ready: false }
                    ],
                    phase: 'readying'
                },
                playerId: 'p1',
                previousModel: {
                    clients: [
                        { id: 'p1', ready: true },
                        { id: 'p2', ready: true }
                    ],
                    phase: 'gameOver'
                },
                roundState: 'gameOver'
            })
        ),
        {
            clearAbandonedRequeue: true,
            clearLocalReadyRequest: true,
            enterGameOverState: false,
            enterLobbyState: true,
            playReadySound: false,
            renderHud: true,
            scheduleAbandonedRequeue: false,
            startRoundRitual: false,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: false,
                resetExisting: true,
                showStraightnessMeter: false,
                slots: [
                    {
                        x: 150,
                        y: 400,
                        facing: 1,
                        frame: 0,
                        movementBounds: {
                            minX: 106,
                            maxX: 310,
                            minY: 320,
                            maxY: 440
                        }
                    },
                    {
                        x: 800,
                        y: 400,
                        facing: -1,
                        frame: 2,
                        movementBounds: {
                            minX: 640,
                            maxX: 844,
                            minY: 320,
                            maxY: 440
                        }
                    }
                ]
            }
        }
    );
});

test('plans game-over presentation when the server ends an active match', async function () {
    const plan = await loadClientModelUpdatePlan();

    const result = plan.create({
        model: {
            clients: [
                { id: 'p1', ready: true },
                { id: 'p2', ready: true }
            ],
            matchState: 'gameOver',
            phase: 'gameOver'
        },
        playerId: 'p1',
        previousModel: {
            clients: [
                { id: 'p1', ready: true },
                { id: 'p2', ready: true }
            ],
            matchState: 'playing',
            phase: 'playing'
        },
        roundState: 'playing'
    });

    assert.equal(result.enterGameOverState, true);
    assert.equal(result.enterLobbyState, false);
    assert.equal(result.startRoundRitual, false);
    assert.equal(result.syncPlayers.showStraightnessMeter, true);
});
