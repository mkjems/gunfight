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

async function loadHudScreens() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule('gameHud.ts', 'gameHud.js', tempDirectory);
    compileClientModule(
        'highScoresScreen.ts',
        'highScoresScreen.js',
        tempDirectory
    );
    compileClientModule('lobbyScreen.ts', 'lobbyScreen.js', tempDirectory);
    compileClientModule(
        'nameEditorScreen.ts',
        'nameEditorScreen.js',
        tempDirectory
    );

    const modules = await Promise.all(
        [
            'gameHud.js',
            'highScoresScreen.js',
            'lobbyScreen.js',
            'nameEditorScreen.js'
        ].map(function (fileName) {
            return import(
                pathToFileURL(path.join(tempDirectory, fileName)).href
            );
        })
    );

    return {
        GameHud: modules[0].GameHud,
        HighScoresScreen: modules[1].HighScoresScreen,
        LobbyScreen: modules[2].LobbyScreen,
        NameEditorScreen: modules[3].NameEditorScreen
    };
}

function createElement(tagName = 'div') {
    const dataset = {};
    let innerHTML = '';
    const element = {
        children: [],
        className: '',
        hidden: false,
        listeners: {},
        style: {},
        tagName,
        textContent: '',
        appendChild(child) {
            this.children.push(child);
        },
        addEventListener(eventName, handler) {
            this.listeners[eventName] = handler;
        },
        get innerHTML() {
            return innerHTML;
        },
        set innerHTML(value) {
            innerHTML = value;
            if (value === '') {
                this.children = [];
            }
        }
    };

    Object.defineProperty(element, 'dataset', {
        get() {
            return dataset;
        }
    });

    return element;
}

function createDocument() {
    return {
        createElement
    };
}

test('renders game HUD scores, timer, round text, and hit messages', async function () {
    const { GameHud } = await loadHudScreens();
    const elements = {
        hitMessage: createElement(),
        roundMessage: createElement(),
        scoreLeft: createElement(),
        scoreRight: createElement(),
        timer: createElement()
    };
    const hud = GameHud(elements);

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

    assert.equal(elements.scoreLeft.textContent, '2');
    assert.equal(elements.scoreRight.textContent, '1');
    assert.equal(elements.timer.textContent, '67');
    assert.equal(elements.roundMessage.textContent, 'DRAW!');
    assert.equal(elements.hitMessage.textContent, 'HIT!');
    assert.equal(elements.hitMessage.style.left, '50%');
    assert.equal(elements.hitMessage.style.top, '50%');
    assert.equal(elements.hitMessage.hidden, false);

    hud.render();

    assert.equal(elements.scoreLeft.textContent, '0');
    assert.equal(elements.scoreRight.textContent, '0');
    assert.equal(elements.timer.textContent, '');
    assert.equal(elements.roundMessage.textContent, '');
    assert.equal(elements.hitMessage.hidden, true);
});

test('renders high-score table rows and empty state', async function () {
    const { HighScoresScreen } = await loadHudScreens();
    const elements = {
        document: createDocument(),
        lobbyMain: createElement(),
        playPrompt: createElement(),
        screen: createElement(),
        table: createElement()
    };
    const screen = HighScoresScreen(elements);

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
    assert.deepEqual(
        elements.table.children[1].children.map(function (cell) {
            return cell.textContent;
        }),
        ['ADA', '2', '3', '1']
    );

    screen.render({
        rows: []
    });

    assert.equal(elements.table.children.length, 2);
    assert.equal(elements.table.children[1].className, 'high-score-empty');
    assert.equal(elements.table.children[1].textContent, 'NO SCORES YET');
});

test('renders and clears lobby screen sections', async function () {
    const { LobbyScreen } = await loadHudScreens();
    const elements = {
        controls: createElement(),
        controlsSection: createElement(),
        document: createDocument(),
        editPrompt: createElement(),
        editPromptSection: createElement(),
        highScores: createElement(),
        identity: createElement(),
        main: createElement(),
        playPrompt: createElement(),
        slots: createElement()
    };
    const screen = LobbyScreen(elements);

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
    assert.equal(elements.controlsSection.hidden, false);
    assert.equal(elements.editPromptSection.hidden, false);
    assert.deepEqual(
        elements.identity.children.map(function (line) {
            return line.textContent;
        }),
        ['YOU ARE ADA']
    );
    assert.deepEqual(
        elements.controls.children.map(function (line) {
            return line.textContent;
        }),
        ['MOVE', 'FIRE']
    );
    assert.equal(
        elements.slots.children[0].className,
        'lobby-slot negative-text'
    );
    assert.equal(elements.slots.children[1].className, 'lobby-slot');
    assert.equal(elements.editPrompt.textContent, 'EDIT NAME');
    assert.equal(elements.playPrompt.hidden, false);
    assert.equal(elements.playPrompt.textContent, 'READY?');

    screen.clear();

    assert.equal(elements.identity.children.length, 0);
    assert.equal(elements.controls.children.length, 0);
    assert.equal(elements.slots.children.length, 0);
    assert.equal(elements.editPrompt.textContent, '');
    assert.equal(elements.playPrompt.textContent, '');
    assert.equal(elements.playPrompt.hidden, true);
});

test('renders name editor grid and dispatches pointer selections', async function () {
    const { NameEditorScreen } = await loadHudScreens();
    const selected = [];
    const elements = {
        document: createDocument(),
        editor: createElement(),
        grid: createElement(),
        help: createElement(),
        highScores: createElement(),
        lobbyMain: createElement(),
        value: createElement()
    };
    const screen = NameEditorScreen(elements);

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
    assert.equal(elements.value.textContent, 'NAME: ACE');
    assert.deepEqual(
        elements.help.children.map(function (line) {
            return line.textContent;
        }),
        ['ARROWS MOVE', 'FIRE SELECTS']
    );
    assert.equal(elements.grid.children.length, 2);
    assert.equal(
        elements.grid.children[0].className,
        'name-editor-row is-short'
    );
    assert.equal(
        elements.grid.children[0].children[1].className,
        'name-editor-key is-selected negative-text'
    );

    let defaultPrevented = false;
    elements.grid.children[0].children[1].listeners.pointerdown({
        preventDefault() {
            defaultPrevented = true;
        }
    });

    assert.equal(defaultPrevented, true);
    assert.deepEqual(selected, [[0, 1]]);

    screen.hide();

    assert.equal(elements.editor.hidden, true);
});
