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

async function loadClientLobbyHudFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'ui/viewModels/clientLobbyViewModel.ts',
        'ui/viewModels/clientLobbyViewModel.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientLobbyHudFlow.ts',
        'flows/clientLobbyHudFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientLobbyHudFlow.js'))
            .href
    );

    return module.ClientLobbyHudFlow;
}

function createRenderOptions(overrides = {}) {
    const calls = [];
    const options = {
        highScores: [{ name: 'Ada' }],
        isTouchInterface() {
            return false;
        },
        localReadyRequested: false,
        model: {
            gameId: 'game-1'
        },
        now: 1,
        nameEditor: {
            getState() {
                return {
                    name: 'ADA'
                };
            },
            isActive() {
                return false;
            }
        },
        onNameEditorSelect(rowIndex, colIndex) {
            calls.push(['onNameEditorSelect', rowIndex, colIndex]);
        },
        playerId: 'p1',
        roundState: 'waiting',
        ...overrides
    };

    return {
        calls,
        options: options
    };
}

function plain(value) {
    return JSON.parse(
        JSON.stringify(value, function (key, value) {
            return typeof value === 'function' ? 'function' : value;
        })
    );
}

test('builds lobby main app state', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { options } = createRenderOptions();

    assert.deepEqual(plain(flow.getState(options)), {
        activeScreen: 'lobby-main',
        canvasVisible: true,
        hudCanvasVisible: true,
        lobby: {
            controls: [
                'h j k l - left down up right',
                'a z - aim up down',
                'Space - shoot'
            ],
            editPrompt: '',
            highScoresPrompt: '',
            identityLines: [],
            playerLabels: [],
            playPrompt: 'PRESS P TO PLAY',
            showControls: true,
            showEditPrompt: false,
            slots: []
        }
    });
});

test('builds high scores app state with keyboard back prompt', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { options } = createRenderOptions({
        highScoresVisible: true,
        model: {
            clients: [{ id: 'p1', ready: false }],
            gameId: 'game-1',
            status: 'waiting'
        }
    });

    assert.deepEqual(plain(flow.getState(options)), {
        activeScreen: 'high-scores',
        canvasVisible: false,
        highScores: {
            backPrompt: 'PRESS S TO RETURN TO LOBBY',
            playPrompt: '',
            rowLimit: 10,
            rows: [
                {
                    name: 'Ada'
                }
            ]
        },
        hudCanvasVisible: false
    });
});

test('builds mobile high scores app state with five rows and no keyboard prompt', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { options } = createRenderOptions({
        highScoresVisible: true,
        isTouchInterface() {
            return true;
        },
        model: {
            clients: [{ id: 'p1', ready: false }],
            gameId: 'game-1',
            status: 'waiting'
        }
    });

    assert.deepEqual(plain(flow.getState(options)), {
        activeScreen: 'high-scores',
        canvasVisible: false,
        highScores: {
            backPrompt: '',
            playPrompt: '',
            rowLimit: 5,
            rows: [
                {
                    name: 'Ada'
                }
            ]
        },
        hudCanvasVisible: false
    });
});

test('keeps main lobby visible until high scores are selected', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { options } = createRenderOptions({
        highScoresVisible: false,
        model: {
            clients: [{ id: 'p1', ready: false }],
            gameId: 'game-1',
            status: 'waiting'
        }
    });

    assert.equal(plain(flow.getState(options)).activeScreen, 'lobby-main');
});

test('builds name editor app state and passes selection callback', async function () {
    const flow = await loadClientLobbyHudFlow();
    const { calls, options } = createRenderOptions({
        nameEditor: {
            getState() {
                return {
                    name: 'ADA'
                };
            },
            isActive() {
                return true;
            }
        }
    });

    const state = flow.getState(options);

    assert.equal(state.activeScreen, 'lobby-edit-name');
    assert.equal(state.canvasVisible, false);
    assert.equal(state.hudCanvasVisible, false);
    assert.deepEqual(state.nameEditor.state, {
        name: 'ADA'
    });
    assert.deepEqual(plain(state.nameEditor.helpLines), [
        'H J K L MOVE',
        'SPACE SELECT',
        'E BACK TO LOBBY'
    ]);

    state.nameEditor.onSelect(1, 2);

    assert.deepEqual(plain(calls), [['onNameEditorSelect', 1, 2]]);
});
