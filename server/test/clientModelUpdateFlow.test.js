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

async function loadClientModelUpdateFlow() {
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
    compileClientModule(
        'network/clientModelUpdateFlow.ts',
        'network/clientModelUpdateFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(
            path.join(tempDirectory, 'network/clientModelUpdateFlow.js')
        ).href
    );

    return module.ClientModelUpdateFlow;
}

function createFlowOptions(overrides = {}) {
    const calls = [];
    const options = {
        clearAbandonedRequeue() {
            calls.push('clearAbandonedRequeue');
        },
        clearLocalReadyRequest() {
            calls.push('clearLocalReadyRequest');
        },
        enterGameOverState() {
            calls.push('enterGameOverState');
        },
        enterLobbyState() {
            calls.push('enterLobbyState');
        },
        model: {
            gameId: 'next'
        },
        playerId: 'p1',
        players: {
            sync(model, syncOptions) {
                calls.push(['players.sync', model.gameId, syncOptions.slots]);
            }
        },
        playReadySound() {
            calls.push('playReadySound');
        },
        previousModel: {
            gameId: 'previous'
        },
        renderHud() {
            calls.push('renderHud');
        },
        roundState: 'waiting',
        scheduleAbandonedRequeue() {
            calls.push('scheduleAbandonedRequeue');
        },
        startRoundRitual() {
            calls.push('startRoundRitual');
        },
        syncNameEditor() {
            calls.push('syncNameEditor');
        },
        syncStoredPlayerName() {
            calls.push('syncStoredPlayerName');
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

function createPlan(overrides = {}) {
    const plan = {
        value: {
            clearAbandonedRequeue: true,
            clearLocalReadyRequest: true,
            enterGameOverState: false,
            enterLobbyState: false,
            playReadySound: true,
            renderHud: true,
            scheduleAbandonedRequeue: false,
            startRoundRitual: false,
            syncNameEditor: true,
            syncPlayers: {
                slots: ['left', 'right']
            },
            syncStoredPlayerName: true,
            ...overrides
        }
    };

    plan.create = function (options) {
        plan.createOptions = options;

        return plan.value;
    };

    return plan;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('applies model update side effects in plan order', async function () {
    const plan = createPlan();
    const flow = await loadClientModelUpdateFlow();
    const { calls, options } = createFlowOptions();

    assert.equal(flow.sync(options, plan.create), plan.value);

    assert.deepEqual(plain(plan.createOptions), {
        model: {
            gameId: 'next'
        },
        playerId: 'p1',
        previousModel: {
            gameId: 'previous'
        },
        roundState: 'waiting'
    });
    assert.deepEqual(plain(calls), [
        'clearLocalReadyRequest',
        'syncStoredPlayerName',
        'clearAbandonedRequeue',
        'playReadySound',
        ['players.sync', 'next', ['left', 'right']],
        'syncNameEditor',
        'renderHud'
    ]);
});

test('starts the round ritual instead of rendering the hud', async function () {
    const plan = createPlan({
        renderHud: false,
        startRoundRitual: true
    });
    const flow = await loadClientModelUpdateFlow();
    const { calls, options } = createFlowOptions();

    flow.sync(options, plan.create);

    assert.deepEqual(plain(calls), [
        'clearLocalReadyRequest',
        'syncStoredPlayerName',
        'clearAbandonedRequeue',
        'playReadySound',
        ['players.sync', 'next', ['left', 'right']],
        'syncNameEditor',
        'startRoundRitual'
    ]);
});

test('applies abandoned lobby recovery effects', async function () {
    const plan = createPlan({
        clearAbandonedRequeue: false,
        enterLobbyState: true,
        playReadySound: false,
        scheduleAbandonedRequeue: true
    });
    const flow = await loadClientModelUpdateFlow();
    const { calls, options } = createFlowOptions();

    flow.sync(options, plan.create);

    assert.deepEqual(plain(calls), [
        'clearLocalReadyRequest',
        'syncStoredPlayerName',
        'enterLobbyState',
        'scheduleAbandonedRequeue',
        ['players.sync', 'next', ['left', 'right']],
        'syncNameEditor',
        'renderHud'
    ]);
});

test('applies server game-over presentation after model sync', async function () {
    const plan = createPlan({
        enterGameOverState: true,
        playReadySound: false
    });
    const flow = await loadClientModelUpdateFlow();
    const { calls, options } = createFlowOptions();

    flow.sync(options, plan.create);

    assert.deepEqual(plain(calls), [
        'clearLocalReadyRequest',
        'syncStoredPlayerName',
        'clearAbandonedRequeue',
        ['players.sync', 'next', ['left', 'right']],
        'syncNameEditor',
        'renderHud',
        'enterGameOverState'
    ]);
});
