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

async function loadClientUi() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-client-ui-')
    );

    [
        ['clientScreens.ts', 'clientScreens.js'],
        ['componentRenderProps.ts', 'componentRenderProps.js'],
        ['config.ts', 'config.js'],
        ['gameHudComponentScreen.tsx', 'gameHudComponentScreen.js'],
        ['highScoresComponentScreen.tsx', 'highScoresComponentScreen.js'],
        ['installPrompt.ts', 'installPrompt.js'],
        ['lobbyComponentScreen.tsx', 'lobbyComponentScreen.js'],
        ['nameEditorComponentScreen.tsx', 'nameEditorComponentScreen.js'],
        [
            'touchGameplayControlsComponentScreen.tsx',
            'touchGameplayControlsComponentScreen.js'
        ],
        [
            'touchLobbyControlsComponentScreen.tsx',
            'touchLobbyControlsComponentScreen.js'
        ],
        ['clientApp.tsx', 'clientApp.js'],
        ['clientUi.ts', 'clientUi.js']
    ].forEach(function ([sourceName, outputName]) {
        compileClientModule(sourceName, outputName, tempDirectory);
    });

    try {
        const module = await import(
            pathToFileURL(path.join(tempDirectory, 'clientUi.js')).href
        );

        return module.ClientUi;
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function createBrowser() {
    const window = new Window();
    const root = window.document.createElement('div');

    root.id = 'appRoot';
    window.document.body.appendChild(root);
    globalThis.document = /** @type {any} */ (window.document);

    return {
        document: window.document,
        root,
        window
    };
}

test('creates the single app root and install prompt controller', async function () {
    const ClientUi = await loadClientUi();
    const browser = createBrowser();
    const ui = ClientUi.create({
        document: browser.document,
        localStorage: browser.window.localStorage,
        window: browser.window
    });

    assert.ok(ui.app);
    assert.ok(ui.installPrompt);

    ui.app.render({
        activeScreen: 'game',
        gameHud: {
            leftScore: 3
        },
        installPrompt: ui.installPrompt.getProps()
    });

    assert.equal(
        /** @type {any} */ (browser.root.querySelector('#gameHud')).hidden,
        false
    );
    assert.equal(
        /** @type {any} */ (browser.root.querySelector('#lobbyHud')).hidden,
        true
    );
    assert.equal(browser.root.querySelector('#scoreLeft').textContent, '3');
});
