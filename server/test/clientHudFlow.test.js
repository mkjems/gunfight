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

async function loadClientHudFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'ui/viewModels/gameHudViewModel.ts',
        'ui/viewModels/gameHudViewModel.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientHudFlow.ts',
        'flows/clientHudFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientHudFlow.js')).href
    );

    return module.ClientHudFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const elements = {
        canvas: {},
        hudCanvas: {
            height: 200,
            width: 300
        }
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
        app: {
            render(state) {
                calls.push(['app.render', state]);
            }
        },
        camera: {},
        cameraController: {},
        defaultSeconds: 70,
        gameHudViewModel: {
            getState(options) {
                return {
                    defaultSeconds: options.defaultSeconds,
                    roundState: options.roundState
                };
            }
        },
        getInstallPromptProps() {
            calls.push('getInstallPromptProps');

            return {
                visible: false
            };
        },
        getLobbyHudState() {
            calls.push('getLobbyHudState');

            return {
                activeScreen: 'lobby-main',
                canvasVisible: true,
                hudCanvasVisible: true,
                lobby: {
                    playPrompt: 'PRESS P TO PLAY'
                }
            };
        },
        getTouchControlsProps() {
            calls.push('getTouchControlsProps');

            return {
                enabled: true
            };
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
        roundData: {},
        roundState: 'playing',
        scoreKeeper: {},
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

test('renders waiting HUD through one app render', async function () {
    const hudFlow = await loadClientHudFlow();
    const { calls, elements, options } = createOptions({
        roundState: 'waiting'
    });

    hudFlow.render(options);

    assert.equal(elements.canvas.hidden, false);
    assert.equal(elements.hudCanvas.hidden, false);
    assert.deepEqual(plain(calls), [
        ['hudContext.clearRect', 0, 0, 300, 200],
        'getLobbyHudState',
        'getInstallPromptProps',
        'getTouchControlsProps',
        [
            'app.render',
            {
                activeScreen: 'lobby-main',
                installPrompt: {
                    visible: false
                },
                lobby: {
                    playPrompt: 'PRESS P TO PLAY'
                },
                touchControls: {
                    enabled: true
                }
            }
        ]
    ]);
});

test('renders active game HUD and both ammo displays', async function () {
    const hudFlow = await loadClientHudFlow();
    const { calls, elements, options } = createOptions();

    hudFlow.render(options);

    assert.equal(elements.canvas.hidden, false);
    assert.equal(elements.hudCanvas.hidden, false);
    assert.deepEqual(plain(calls), [
        ['hudContext.clearRect', 0, 0, 300, 200],
        'getInstallPromptProps',
        'getTouchControlsProps',
        [
            'app.render',
            {
                activeScreen: 'game',
                gameHud: {
                    defaultSeconds: 70,
                    roundState: 'playing'
                },
                installPrompt: {
                    visible: false
                },
                touchControls: {
                    enabled: true
                }
            }
        ],
        ['ammo.get', 'p1'],
        ['ammoHudRenderer.render', 4, 122, 606, 1],
        ['ammo.get', 'p2'],
        ['ammoHudRenderer.render', 2, 828, 606, -1]
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
        'getInstallPromptProps',
        'getTouchControlsProps',
        [
            'app.render',
            {
                activeScreen: 'game',
                gameHud: {
                    defaultSeconds: 70,
                    roundState: 'playing'
                },
                installPrompt: {
                    visible: false
                },
                touchControls: {
                    enabled: true
                }
            }
        ]
    ]);
});
