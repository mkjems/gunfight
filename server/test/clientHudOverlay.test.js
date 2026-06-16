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
    const source = stubCssModuleImports(
        readFileSync(path.join(process.cwd(), 'client/src', sourceName), 'utf8')
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

function stubCssModuleImports(source) {
    return source.replace(
        /import\s+(\w+)\s+from\s+['"][^'"]+\.module\.css['"];?/g,
        'const $1 = new Proxy({}, { get(_target, property) { return String(property); } });'
    );
}

async function loadClientUi() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-client-ui-')
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
        ['ui/installPrompt.ts', 'ui/installPrompt.js'],
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
        ['ui/clientApp.tsx', 'ui/clientApp.js'],
        ['ui/clientUi.ts', 'ui/clientUi.js']
    ].forEach(function ([sourceName, outputName]) {
        compileClientModule(sourceName, outputName, tempDirectory);
    });

    try {
        const module = await import(
            pathToFileURL(path.join(tempDirectory, 'ui/clientUi.js')).href
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
    globalThis.document = /** @type {Document} */ (
        /** @type {unknown} */ (window.document)
    );

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
        /** @type {HTMLElement} */ (
            /** @type {unknown} */ (browser.root.querySelector('#gameHud'))
        ).hidden,
        false
    );
    assert.equal(
        /** @type {HTMLElement} */ (
            /** @type {unknown} */ (browser.root.querySelector('#lobbyHud'))
        ).hidden,
        true
    );
    assert.equal(browser.root.querySelector('#scoreLeft').textContent, '3');
});
