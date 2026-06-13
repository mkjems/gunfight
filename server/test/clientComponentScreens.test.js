import assert from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { Window } from 'happy-dom';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            jsxImportSource: 'preact',
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        },
        fileName: sourceName
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadClientApp() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-client-app-')
    );

    [
        ['state/clientScreens.ts', 'state/clientScreens.js'],
        ['ui/componentRenderProps.ts', 'ui/componentRenderProps.js'],
        ['platform/config.ts', 'platform/config.js'],
        [
            'ui/components/gameHudComponentScreen.tsx',
            'ui/components/gameHudComponentScreen.js'
        ],
        [
            'ui/components/highScoresComponentScreen.tsx',
            'ui/components/highScoresComponentScreen.js'
        ],
        [
            'ui/components/lobbyComponentScreen.tsx',
            'ui/components/lobbyComponentScreen.js'
        ],
        [
            'ui/components/nameEditorComponentScreen.tsx',
            'ui/components/nameEditorComponentScreen.js'
        ],
        [
            'ui/components/touchGameplayControlsComponentScreen.tsx',
            'ui/components/touchGameplayControlsComponentScreen.js'
        ],
        [
            'ui/components/touchLobbyControlsComponentScreen.tsx',
            'ui/components/touchLobbyControlsComponentScreen.js'
        ],
        ['ui/clientApp.tsx', 'ui/clientApp.js']
    ].forEach(function ([sourceName, outputName]) {
        compileClientModule(sourceName, outputName, tempDirectory);
    });

    try {
        const [appModule, screensModule] = await Promise.all(
            ['ui/clientApp.js', 'state/clientScreens.js'].map(
                function (fileName) {
                    return import(
                        pathToFileURL(path.join(tempDirectory, fileName)).href
                    );
                }
            )
        );

        return {
            ClientAppMount: appModule.ClientAppMount,
            Screen: screensModule.Screen
        };
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function createBrowser() {
    const window = new Window();

    globalThis.document = /** @type {Document} */ (
        /** @type {unknown} */ (window.document)
    );

    return {
        createElement(tagName = 'div') {
            return window.document.createElement(tagName);
        },
        window
    };
}

function childTexts(element) {
    return Array.from(element.children).map(function (child) {
        return child.textContent;
    });
}

/**
 * @typedef {HTMLElement & {
 *     dispatchEvent: (event: unknown) => boolean
 * }} TestElement
 */

/** @returns {TestElement} */
function query(element, selector) {
    return /** @type {TestElement} */ (
        /** @type {unknown} */ (element.querySelector(selector))
    );
}

test('renders game HUD scores, timer, round text, and hit messages through the app root', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.GAME,
        gameHud: {
            hitMessage: {
                text: 'HIT!',
                x: 475,
                y: 320
            },
            leftScore: 2,
            rightScore: 1,
            roundMessage: 'DRAW!',
            timerLabel: 67
        }
    });

    assert.equal(query(root, '#gameHud').hidden, false);
    assert.equal(query(root, '#lobbyHud').hidden, true);
    assert.equal(root.querySelector('#scoreLeft').textContent, '2');
    assert.equal(root.querySelector('#scoreRight').textContent, '1');
    assert.equal(root.querySelector('#roundTimer').textContent, '67');
    assert.equal(root.querySelector('#roundMessage').textContent, 'DRAW!');

    const hitMessage = query(root, '#hitMessage');
    assert.equal(hitMessage.textContent, 'HIT!');
    assert.equal(hitMessage.style.left, '50%');
    assert.equal(hitMessage.style.top, '50%');
    assert.equal(hitMessage.hidden, false);

    app.render({
        activeScreen: Screen.GAME,
        gameHud: {}
    });

    assert.equal(root.querySelector('#scoreLeft').textContent, '0');
    assert.equal(root.querySelector('#scoreRight').textContent, '0');
    assert.equal(root.querySelector('#roundTimer').textContent, '');
    assert.equal(root.querySelector('#roundMessage').textContent, '');
    assert.equal(query(root, '#hitMessage').hidden, true);
});

test('renders high-score table rows with ten ranked places through the app root', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.HIGH_SCORES,
        highScores: {
            backPrompt: 'PRESS S',
            rows: [
                {
                    deaths: 1,
                    kills: 3,
                    name: 'ADA',
                    wins: 2
                }
            ]
        }
    });

    assert.equal(query(root, '#lobby-main').hidden, true);
    assert.equal(query(root, '#highScoresScreen').hidden, false);
    assert.equal(
        query(root, '#highScoresScreen h1').textContent,
        'HIGH SCORES'
    );
    assert.equal(query(root, '#highScoresBackPrompt').textContent, 'PRESS S');
    assert.equal(query(root, '#highScoresPlayPrompt').textContent, '');
    assert.equal(query(root, '#highScoresTable').children.length, 11);
    assert.equal(
        query(root, '#highScoresTable').children[0].className,
        'high-score-row is-header'
    );
    assert.deepEqual(childTexts(query(root, '#highScoresTable').children[0]), [
        'PLACE',
        'NAME',
        'WINS',
        'KILLS',
        'DEATHS'
    ]);
    assert.deepEqual(childTexts(query(root, '#highScoresTable').children[1]), [
        '1ST',
        'ADA',
        '2',
        '3',
        '1'
    ]);

    app.render({
        activeScreen: Screen.HIGH_SCORES,
        highScores: {
            rows: []
        }
    });

    assert.equal(query(root, '#highScoresTable').children.length, 11);
    assert.deepEqual(childTexts(query(root, '#highScoresTable').children[1]), [
        '1ST',
        '',
        '',
        '',
        ''
    ]);
    assert.deepEqual(childTexts(query(root, '#highScoresTable').children[10]), [
        '10TH',
        '',
        '',
        '',
        ''
    ]);
    assert.equal(
        query(root, '#highScoresTable').textContent.includes('NO SCORES YET'),
        false
    );
});

test('renders mobile high scores with five rows and touch actions underneath', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.HIGH_SCORES,
        highScores: {
            rowLimit: 5,
            rows: []
        },
        touchControls: {
            enabled: true,
            lobby: {
                showBackButton: true,
                visible: true
            }
        }
    });

    const touchControls = query(root, '#touchLobbyControls');

    assert.equal(query(root, '#highScoresTable').children.length, 6);
    assert.deepEqual(childTexts(query(root, '#highScoresTable').children[5]), [
        '5TH',
        '',
        '',
        '',
        ''
    ]);
    assert.equal(touchControls.hidden, false);
    assert.equal(touchControls.className, 'is-high-scores');
    assert.equal(query(root, '#touchEditButton').hidden, true);
    assert.equal(query(root, '#touchHighScoresButton').hidden, true);
    assert.equal(query(root, '#touchPlayButton').hidden, true);
    assert.equal(query(root, '#touchBackButton').hidden, false);
});

test('renders lobby screen sections through the app root', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        lobby: {
            controls: ['MOVE', 'FIRE'],
            editPrompt: 'EDIT NAME',
            highScoresPrompt: 'SCORES',
            opponentPlaceholder: [
                {
                    key: 'opponent-placeholder-marker',
                    negative: true,
                    text: '?',
                    variant: 'opponent-placeholder-marker',
                    x: 84.2,
                    y: 50
                },
                {
                    key: 'opponent-placeholder-message',
                    text: 'LOOKING FOR OPPONENT',
                    variant: 'opponent-placeholder-message',
                    x: 84.2,
                    y: 74
                }
            ],
            playPrompt: 'READY?',
            playerLabels: [
                {
                    key: 'p1-name',
                    text: 'ACE',
                    x: 12.5,
                    y: 75
                },
                {
                    key: 'p1-status',
                    negative: true,
                    text: 'READY',
                    x: 12.5,
                    y: 80
                }
            ],
            showControls: true,
            showEditPrompt: true
        }
    });

    const main = query(root, '#lobby-main');
    const controls = query(main, '#lobbyControlsText');
    const editPrompt = query(main, '#lobbyEditPrompt');
    const labels = query(main, '#lobbyPlayerLabels');
    const highScoresPrompt = query(main, '#lobbyHighScoresPrompt');
    const playPrompt = query(main, '#lobbyPlayPrompt');

    assert.equal(main.hidden, false);
    assert.equal(query(root, '#highScoresScreen').hidden, true);
    assert.equal(controls.hidden, false);
    assert.equal(editPrompt.hidden, false);
    assert.deepEqual(childTexts(controls), ['MOVE', 'FIRE']);
    assert.deepEqual(childTexts(labels), [
        'ACE',
        'READY',
        '?',
        'LOOKING FOR OPPONENT'
    ]);
    assert.equal(
        labels.children[0].getAttribute('style'),
        'left: 12.5%; top: 75%;'
    );
    assert.equal(
        labels.children[1].className,
        'lobby-player-label negative-text'
    );
    assert.equal(
        labels.children[2].className,
        'lobby-player-label is-opponent-placeholder-marker negative-text'
    );
    assert.equal(editPrompt.textContent, 'EDIT NAME');
    assert.equal(highScoresPrompt.textContent, 'SCORES');
    assert.equal(playPrompt.textContent, 'READY?');

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        lobby: {}
    });

    assert.equal(query(main, '#lobbyControlsText').children.length, 0);
    assert.equal(query(main, '#lobbyControlsText').hidden, true);
    assert.equal(query(main, '#lobbyEditPrompt').hidden, true);
    assert.equal(query(main, '#lobbyEditPrompt').textContent, '');
    assert.equal(query(main, '#lobbyHighScoresPrompt').textContent, '');
    assert.equal(query(main, '#lobbyPlayPrompt').textContent, '');
});

test('skips virtual-DOM work when app render props are value-equal', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const renders = [];
    const app = ClientAppMount.create({
        afterRender() {
            renders.push('rendered');
        },
        root
    });

    function props(timerLabel) {
        return {
            activeScreen: Screen.GAME,
            gameHud: {
                hitMessage: {
                    text: 'HIT!',
                    x: 475,
                    y: 320
                },
                leftScore: 1,
                rightScore: 2,
                roundMessage: '',
                timerLabel
            },
            touchControls: {
                enabled: true,
                lobby: {
                    onBack() {},
                    onEdit() {},
                    onHighScores() {},
                    onPlay() {},
                    showMainButtons: true,
                    visible: true
                }
            }
        };
    }

    assert.equal(app.render(props(70)), true);
    assert.equal(app.render(props(70)), false);
    assert.equal(app.render(props(69)), true);
    assert.deepEqual(renders, ['rendered', 'rendered']);
});

test('renders touch lobby buttons and dispatches tap actions through the app root', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const actions = [];
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        touchControls: {
            enabled: true,
            lobby: {
                onEdit() {
                    actions.push('edit');
                },
                onHighScores() {
                    actions.push('scores');
                },
                onPlay() {
                    actions.push('play');
                },
                showMainButtons: true,
                visible: true
            }
        }
    });

    assert.equal(query(root, '#touchLobbyControls').hidden, false);

    const editButton = query(root, '#touchEditButton');
    const highScoresButton = query(root, '#touchHighScoresButton');
    const playButton = query(root, '#touchPlayButton');
    const backButton = query(root, '#touchBackButton');
    assert.equal(editButton.textContent, 'EDIT NAME');
    assert.equal(highScoresButton.textContent, 'HIGH SCORES');
    assert.equal(playButton.textContent, 'PLAY GUNFIGHT');
    assert.equal(backButton.textContent, 'BACK TO LOBBY');
    assert.equal(editButton.hidden, false);
    assert.equal(highScoresButton.hidden, false);
    assert.equal(playButton.hidden, false);
    assert.equal(backButton.hidden, true);

    const pointerDown = new browser.window.PointerEvent('pointerdown', {
        cancelable: true
    });
    playButton.dispatchEvent(pointerDown);
    highScoresButton.dispatchEvent(
        new browser.window.PointerEvent('pointerdown', { cancelable: true })
    );
    editButton.dispatchEvent(
        new browser.window.PointerEvent('pointerdown', { cancelable: true })
    );

    assert.equal(pointerDown.defaultPrevented, true);
    assert.deepEqual(actions, ['play', 'scores', 'edit']);

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        touchControls: {
            enabled: true,
            lobby: {
                showBackButton: true,
                visible: true
            }
        }
    });

    assert.equal(query(root, '#touchLobbyControls').hidden, false);
    assert.equal(query(root, '#touchEditButton').hidden, true);
    assert.equal(query(root, '#touchHighScoresButton').hidden, true);
    assert.equal(query(root, '#touchPlayButton').hidden, true);
    assert.equal(query(root, '#touchBackButton').hidden, false);

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        touchControls: {
            enabled: true,
            lobby: {
                visible: false
            }
        }
    });

    assert.equal(query(root, '#touchLobbyControls').hidden, true);
});

test('renders gameplay touch controls markup and keeps imperative styles', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.GAME,
        touchControls: {
            enabled: true,
            gameplay: {
                visible: false
            }
        }
    });

    assert.equal(query(root, '#touchControls').hidden, false);
    assert.equal(query(root, '#touchJoystick').hidden, true);
    assert.equal(query(root, '#touchActionControls').hidden, true);

    app.render({
        activeScreen: Screen.GAME,
        touchControls: {
            debug: true,
            editing: true,
            enabled: true,
            gameplay: {
                visible: true
            },
            playing: true
        }
    });

    const touchRoot = query(root, '#touchControls');
    const joystick = query(root, '#touchJoystick');
    const knob = query(root, '#touchJoystickKnob');
    const aimHandle = query(root, '#touchAimHandle');
    const shootButton = query(root, '#touchShootButton');

    assert.equal(touchRoot.className, 'debug-touch is-playing is-editing');
    assert.equal(joystick.hidden, false);
    assert.equal(joystick.getAttribute('aria-label'), 'Move');
    assert.equal(
        query(root, '#touchAimSlider').getAttribute('aria-label'),
        'Aim'
    );
    assert.ok(query(root, '#touchAimTrack'));
    assert.equal(shootButton.textContent, 'FIRE');

    knob.style.transform = 'translate(5px, 6px)';
    aimHandle.style.top = '25%';

    app.render({
        activeScreen: Screen.GAME,
        touchControls: {
            enabled: true,
            gameplay: {
                visible: false
            }
        }
    });
    app.render({
        activeScreen: Screen.GAME,
        touchControls: {
            enabled: true,
            gameplay: {
                visible: true
            }
        }
    });

    assert.equal(query(root, '#touchJoystickKnob'), knob);
    assert.equal(knob.style.transform, 'translate(5px, 6px)');
    assert.equal(query(root, '#touchAimHandle').style.top, '25%');
});

test('renders name editor grid and dispatches pointer selections through the app root', async function () {
    const { ClientAppMount, Screen } = await loadClientApp();
    const browser = createBrowser();
    const selected = [];
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.LOBBY_EDIT_NAME,
        nameEditor: {
            helpLines: ['ARROWS MOVE', 'FIRE SELECTS'],
            onSelect(rowIndex, colIndex) {
                selected.push([rowIndex, colIndex]);
            },
            state: {
                cursorCol: 1,
                cursorRow: 0,
                grid: [['A', 'B'], ['OK']],
                name: 'ACE'
            }
        }
    });

    assert.equal(query(root, '#lobby-main').hidden, true);
    assert.equal(query(root, '#highScoresScreen').hidden, true);
    assert.equal(query(root, '#nameEditor').hidden, false);
    assert.equal(query(root, '#nameEditorValue').textContent, 'NAME: ACE');
    assert.deepEqual(childTexts(query(root, '#nameEditorHelp')), [
        'ARROWS MOVE',
        'FIRE SELECTS'
    ]);

    const grid = query(root, '#nameEditorGrid');
    assert.equal(grid.children.length, 2);
    assert.equal(grid.children[0].className, 'name-editor-row is-short');

    const selectedKey = /** @type {TestElement} */ (
        /** @type {unknown} */ (grid.children[0].children[1])
    );
    assert.equal(
        selectedKey.className,
        'name-editor-key is-selected negative-text'
    );

    const pointerDown = new browser.window.PointerEvent('pointerdown', {
        cancelable: true
    });
    selectedKey.dispatchEvent(pointerDown);

    assert.equal(pointerDown.defaultPrevented, true);
    assert.deepEqual(selected, [[0, 1]]);
});
