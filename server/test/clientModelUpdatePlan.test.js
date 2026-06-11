import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadClientModelUpdatePlan() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientModelSync.ts',
        'clientModelSync.js',
        tempDirectory
    );
    compileClientModule(
        'clientModelUpdatePlan.ts',
        'clientModelUpdatePlan.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientModelUpdatePlan.js')).href
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
                resetChangedSlots: true,
                slots: [
                    { x: 120, y: 430, facing: 1, frame: 0 },
                    { x: 830, y: 430, facing: -1, frame: 2 }
                ]
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
                slots: [
                    { x: 150, y: 430, facing: 1, frame: 0 },
                    { x: 800, y: 430, facing: -1, frame: 2 }
                ]
            }
        }
    );
});
