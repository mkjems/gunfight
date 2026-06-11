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

async function loadClientHudFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'gameHudViewModel.ts',
        'gameHudViewModel.js',
        tempDirectory
    );
    compileClientModule('clientHudFlow.ts', 'clientHudFlow.js', tempDirectory);

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientHudFlow.js')).href
    );

    return module.ClientHudFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const elements = {
        canvas: {},
        gameHud: {},
        hudCanvas: {
            height: 200,
            width: 300
        },
        lobbyHud: {}
    };
    const options = {
        ...elements,
        ammo: {
            get(id) {
                calls.push(['ammo.get', id]);

                return id === 'p1' ? 4 : 2;
            }
        },
        ammoHudRenderer: {
            render(ammo, x, y, direction) {
                calls.push(['ammoHudRenderer.render', ammo, x, y, direction]);
            }
        },
        camera: {},
        cameraController: {},
        defaultSeconds: 70,
        gameHudScreen: {
            render(state) {
                calls.push(['gameHudScreen.render', state]);
            }
        },
        gameHudViewModel: {
            getState(options) {
                return {
                    defaultSeconds: options.defaultSeconds,
                    roundState: options.roundState
                };
            }
        },
        hudContext: {
            clearRect(x, y, width, height) {
                calls.push(['hudContext.clearRect', x, y, width, height]);
            }
        },
        model: {
            clients: [{ id: 'p1' }, { id: 'p2' }]
        },
        players: {},
        renderLobbyHud() {
            calls.push('renderLobbyHud');
        },
        roundData: {},
        roundState: 'playing',
        scoreKeeper: {},
        updateTouchControls() {
            calls.push('updateTouchControls');
        },
        ...overrides
    };

    return {
        calls,
        elements,
        options: options
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('renders waiting HUD through the lobby branch', async function () {
    const hudFlow = await loadClientHudFlow();
    const { calls, options } = createOptions({
        roundState: 'waiting'
    });

    hudFlow.render(options);

    assert.deepEqual(plain(calls), [
        ['hudContext.clearRect', 0, 0, 300, 200],
        'renderLobbyHud',
        'updateTouchControls'
    ]);
});

test('renders active game HUD and both ammo displays', async function () {
    const hudFlow = await loadClientHudFlow();
    const { calls, elements, options } = createOptions();

    hudFlow.render(options);

    assert.equal(elements.canvas.hidden, false);
    assert.equal(elements.hudCanvas.hidden, false);
    assert.equal(elements.gameHud.hidden, false);
    assert.equal(elements.lobbyHud.hidden, true);
    assert.deepEqual(plain(calls), [
        ['hudContext.clearRect', 0, 0, 300, 200],
        [
            'gameHudScreen.render',
            {
                defaultSeconds: 70,
                roundState: 'playing'
            }
        ],
        ['ammo.get', 'p1'],
        ['ammoHudRenderer.render', 4, 122, 606, 1],
        ['ammo.get', 'p2'],
        ['ammoHudRenderer.render', 2, 828, 606, -1],
        'updateTouchControls'
    ]);
});

test('renders active game HUD without ammo when clients are missing', async function () {
    const hudFlow = await loadClientHudFlow();
    const { calls, options } = createOptions({
        model: {
            clients: []
        }
    });

    hudFlow.render(options);

    assert.deepEqual(plain(calls), [
        ['hudContext.clearRect', 0, 0, 300, 200],
        [
            'gameHudScreen.render',
            {
                defaultSeconds: 70,
                roundState: 'playing'
            }
        ]
    ]);
});
