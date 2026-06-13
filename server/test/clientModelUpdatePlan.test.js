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
                localPlayerFirst: false,
                resetChangedSlots: true,
                slots: [
                    { x: 150, y: 430, facing: 1, frame: 0 },
                    { x: 800, y: 430, facing: -1, frame: 2 }
                ]
            }
        }
    );
});

test('plans local-first lobby slots while waiting in the lobby', async function () {
    const plan = await loadClientModelUpdatePlan();
    const model = {
        clients: [
            { id: 'p1', ready: false },
            { id: 'p2', ready: false }
        ],
        status: 'readying'
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
            localPlayerFirst: true,
            localPlayerId: 'p2',
            resetChangedSlots: true,
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
                localPlayerFirst: false,
                resetChangedSlots: false,
                slots: [
                    { x: 150, y: 430, facing: 1, frame: 0 },
                    { x: 800, y: 430, facing: -1, frame: 2 }
                ]
            }
        }
    );
});
