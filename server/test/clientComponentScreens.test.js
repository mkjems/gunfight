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
        path.join(process.cwd(), 'client/src/modules', sourceName),
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

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadComponentScreens() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-component-screens-')
    );

    compileClientModule(
        'componentRenderProps.ts',
        'componentRenderProps.js',
        tempDirectory
    );
    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule(
        'gameHudComponentScreen.tsx',
        'gameHudComponentScreen.js',
        tempDirectory
    );
    compileClientModule(
        'highScoresComponentScreen.tsx',
        'highScoresComponentScreen.js',
        tempDirectory
    );
    compileClientModule(
        'lobbyComponentScreen.tsx',
        'lobbyComponentScreen.js',
        tempDirectory
    );
    compileClientModule(
        'nameEditorComponentScreen.tsx',
        'nameEditorComponentScreen.js',
        tempDirectory
    );
    compileClientModule(
        'touchLobbyControlsComponentScreen.tsx',
        'touchLobbyControlsComponentScreen.js',
        tempDirectory
    );

    try {
        const modules = await Promise.all(
            [
                'gameHudComponentScreen.js',
                'highScoresComponentScreen.js',
                'lobbyComponentScreen.js',
                'nameEditorComponentScreen.js',
                'touchLobbyControlsComponentScreen.js'
            ].map(function (fileName) {
                return import(
                    pathToFileURL(path.join(tempDirectory, fileName)).href
                );
            })
        );

        return {
            GameHudComponentScreen: modules[0].GameHudComponentScreen,
            HighScoresComponentScreen: modules[1].HighScoresComponentScreen,
            LobbyComponentScreen: modules[2].LobbyComponentScreen,
            NameEditorComponentScreen: modules[3].NameEditorComponentScreen,
            TouchLobbyControlsComponentScreen:
                modules[4].TouchLobbyControlsComponentScreen
        };
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function createBrowser() {
    const window = new Window();

    globalThis.document = /** @type {any} */ (window.document);

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

/** @returns {any} */
function query(element, selector) {
    return element.querySelector(selector);
}

test('renders game HUD scores, timer, round text, and hit messages', async function () {
    const { GameHudComponentScreen } = await loadComponentScreens();
    const browser = createBrowser();
    const root = browser.createElement();
    const hud = new GameHudComponentScreen({ root });

    hud.render({
        hitMessage: {
            text: 'HIT!',
            x: 475,
            y: 320
        },
        leftScore: 2,
        rightScore: 1,
        roundMessage: 'DRAW!',
        timerLabel: 67
    });

    assert.equal(root.querySelector('#scoreLeft').textContent, '2');
    assert.equal(root.querySelector('#scoreRight').textContent, '1');
    assert.equal(root.querySelector('#roundTimer').textContent, '67');
    assert.equal(root.querySelector('#roundMessage').textContent, 'DRAW!');

    const hitMessage = query(root, '#hitMessage');
    assert.equal(hitMessage.textContent, 'HIT!');
    assert.equal(hitMessage.style.left, '50%');
    assert.equal(hitMessage.style.top, '50%');
    assert.equal(hitMessage.hidden, false);

    hud.render();

    assert.equal(root.querySelector('#scoreLeft').textContent, '0');
    assert.equal(root.querySelector('#scoreRight').textContent, '0');
    assert.equal(root.querySelector('#roundTimer').textContent, '');
    assert.equal(root.querySelector('#roundMessage').textContent, '');
    assert.equal(query(root, '#hitMessage').hidden, true);
});

test('renders high-score table rows and empty state', async function () {
    const { HighScoresComponentScreen } = await loadComponentScreens();
    const browser = createBrowser();
    const elements = {
        lobbyMain: browser.createElement(),
        playPrompt: browser.createElement(),
        screen: browser.createElement(),
        table: browser.createElement()
    };
    const screen = new HighScoresComponentScreen(elements);

    screen.render({
        playPrompt: 'PRESS FIRE',
        rows: [
            {
                deaths: 1,
                kills: 3,
                name: 'ADA',
                wins: 2
            }
        ]
    });

    assert.equal(elements.lobbyMain.hidden, true);
    assert.equal(elements.screen.hidden, false);
    assert.equal(elements.playPrompt.textContent, 'PRESS FIRE');
    assert.equal(elements.table.children.length, 2);
    assert.equal(
        elements.table.children[0].className,
        'high-score-row is-header'
    );
    assert.deepEqual(childTexts(elements.table.children[1]), [
        'ADA',
        '2',
        '3',
        '1'
    ]);

    screen.render({
        rows: []
    });

    assert.equal(elements.table.children.length, 2);
    assert.equal(elements.table.children[1].className, 'high-score-empty');
    assert.equal(elements.table.children[1].textContent, 'NO SCORES YET');
});

test('renders and clears lobby screen sections', async function () {
    const { LobbyComponentScreen } = await loadComponentScreens();
    const browser = createBrowser();
    const elements = {
        highScores: browser.createElement(),
        main: browser.createElement()
    };
    const screen = new LobbyComponentScreen(elements);

    screen.render({
        controls: ['MOVE', 'FIRE'],
        editPrompt: 'EDIT NAME',
        identityLines: ['YOU ARE ADA'],
        playPrompt: 'READY?',
        showControls: true,
        showEditPrompt: true,
        slots: [
            {
                label: 'P1 READY',
                ready: true
            },
            {
                label: 'P2 WAITING',
                ready: false
            }
        ]
    });

    assert.equal(elements.main.hidden, false);
    assert.equal(elements.highScores.hidden, true);

    const main = elements.main;
    const controls = query(main, '#lobbyControlsText');
    const editPrompt = query(main, '#lobbyEditPrompt');
    const identity = query(main, '#lobbyIdentity');
    const playPrompt = query(main, '#lobbyPlayPrompt');
    const slots = query(main, '#lobbySlots');

    assert.equal(controls.parentElement.hidden, false);
    assert.equal(editPrompt.hidden, false);
    assert.deepEqual(childTexts(identity), ['YOU ARE ADA']);
    assert.deepEqual(childTexts(controls), ['MOVE', 'FIRE']);
    assert.equal(slots.children[0].className, 'lobby-slot negative-text');
    assert.equal(slots.children[0].textContent, 'P1 READY');
    assert.equal(slots.children[1].className, 'lobby-slot');
    assert.equal(editPrompt.textContent, 'EDIT NAME');
    assert.equal(playPrompt.textContent, 'READY?');

    screen.clear();

    assert.equal(main.querySelector('#lobbyIdentity').children.length, 0);
    assert.equal(main.querySelector('#lobbyControlsText').children.length, 0);
    assert.equal(main.querySelector('#lobbySlots').children.length, 0);
    assert.equal(query(main, '#lobbyControlsText').parentElement.hidden, true);
    assert.equal(query(main, '#lobbyEditPrompt').hidden, true);
    assert.equal(main.querySelector('#lobbyEditPrompt').textContent, '');
    assert.equal(main.querySelector('#lobbyPlayPrompt').textContent, '');
});

test('skips virtual-DOM work when render props are value-equal', async function () {
    const {
        GameHudComponentScreen,
        LobbyComponentScreen,
        TouchLobbyControlsComponentScreen
    } = await loadComponentScreens();
    const browser = createBrowser();

    const hud = new GameHudComponentScreen({ root: browser.createElement() });

    function hudProps(timerLabel) {
        return {
            hitMessage: {
                text: 'HIT!',
                x: 475,
                y: 320
            },
            leftScore: 1,
            rightScore: 2,
            roundMessage: '',
            timerLabel
        };
    }

    assert.equal(hud.render(hudProps(70)), true);
    assert.equal(hud.render(hudProps(70)), false);
    assert.equal(hud.render(hudProps(69)), true);

    const touch = new TouchLobbyControlsComponentScreen({
        root: browser.createElement()
    });

    function touchProps(showButtons) {
        return {
            onEdit() {},
            onPlay() {},
            showButtons,
            visible: true
        };
    }

    assert.equal(touch.render(touchProps(true)), true);
    assert.equal(touch.render(touchProps(true)), false);
    assert.equal(touch.render(touchProps(false)), true);

    const lobby = new LobbyComponentScreen({
        highScores: browser.createElement(),
        main: browser.createElement()
    });

    function lobbyProps() {
        return {
            identityLines: ['YOU ARE ADA'],
            slots: [
                {
                    label: 'P1',
                    ready: false
                }
            ]
        };
    }

    assert.equal(lobby.render(lobbyProps()), true);
    assert.equal(lobby.render(lobbyProps()), false);
    assert.equal(lobby.clear(), true);
    assert.equal(lobby.clear(), false);
    assert.equal(lobby.render(lobbyProps()), true);
});

test('renders touch lobby buttons and dispatches tap actions', async function () {
    const { TouchLobbyControlsComponentScreen } = await loadComponentScreens();
    const browser = createBrowser();
    const actions = [];
    const root = browser.createElement();
    const screen = new TouchLobbyControlsComponentScreen({ root });

    screen.render({
        onEdit() {
            actions.push('edit');
        },
        onPlay() {
            actions.push('play');
        },
        showButtons: true,
        visible: true
    });

    assert.equal(root.hidden, false);

    const editButton = query(root, '#touchEditButton');
    const playButton = query(root, '#touchPlayButton');
    assert.equal(editButton.textContent, 'EDIT NAME');
    assert.equal(playButton.textContent, 'TAP PLAY');
    assert.equal(editButton.hidden, false);
    assert.equal(playButton.hidden, false);

    const pointerDown = new browser.window.PointerEvent('pointerdown', {
        cancelable: true
    });
    playButton.dispatchEvent(pointerDown);
    editButton.dispatchEvent(
        new browser.window.PointerEvent('pointerdown', { cancelable: true })
    );

    assert.equal(pointerDown.defaultPrevented, true);
    assert.deepEqual(actions, ['play', 'edit']);

    screen.render({
        showButtons: false,
        visible: true
    });

    assert.equal(root.hidden, false);
    assert.equal(query(root, '#touchEditButton').hidden, true);
    assert.equal(query(root, '#touchPlayButton').hidden, true);

    screen.render({
        visible: false
    });

    assert.equal(root.hidden, true);
});

test('renders name editor grid and dispatches pointer selections', async function () {
    const { NameEditorComponentScreen } = await loadComponentScreens();
    const browser = createBrowser();
    const selected = [];
    const elements = {
        editor: browser.createElement(),
        highScores: browser.createElement(),
        lobbyMain: browser.createElement()
    };
    const screen = new NameEditorComponentScreen(elements);

    screen.render({
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
    });

    assert.equal(elements.lobbyMain.hidden, true);
    assert.equal(elements.highScores.hidden, true);
    assert.equal(elements.editor.hidden, false);

    const editor = elements.editor;
    assert.equal(
        editor.querySelector('#nameEditorValue').textContent,
        'NAME: ACE'
    );
    assert.deepEqual(childTexts(editor.querySelector('#nameEditorHelp')), [
        'ARROWS MOVE',
        'FIRE SELECTS'
    ]);

    const grid = editor.querySelector('#nameEditorGrid');
    assert.equal(grid.children.length, 2);
    assert.equal(grid.children[0].className, 'name-editor-row is-short');

    const selectedKey = grid.children[0].children[1];
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

    screen.hide();

    assert.equal(elements.editor.hidden, true);
});
