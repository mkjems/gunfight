import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { afterEach, test } from 'vitest';
import { Screen } from '../state/clientScreens.js';
import { ClientUi } from './clientUi.js';

const testGlobal = globalThis as typeof globalThis & {
    document?: Document;
};

afterEach(function () {
    Reflect.deleteProperty(testGlobal, 'document');
});

function createBrowser() {
    const window = new Window();
    const root = window.document.createElement('div');

    root.id = 'appRoot';
    window.document.body.appendChild(root);
    testGlobal.document = window.document as unknown as Document;

    return {
        document: window.document as unknown as Document,
        root: root as unknown as HTMLElement,
        window
    };
}

test('creates the single app root and install prompt controller', function () {
    const browser = createBrowser();
    const ui = ClientUi.create({
        document: browser.document,
        localStorage: browser.window.localStorage as unknown as Storage,
        window: browser.window as unknown as globalThis.Window
    });

    assert.ok(ui.app);
    assert.ok(ui.installPrompt);

    ui.app.render({
        activeScreen: Screen.GAME,
        gameHud: {
            leftScore: 3
        },
        installPrompt: ui.installPrompt.getProps()
    });

    assert.equal(
        (browser.root.querySelector('#gameHud') as HTMLElement).hidden,
        false
    );
    assert.equal(
        (browser.root.querySelector('#lobbyHud') as HTMLElement).hidden,
        true
    );
    assert.equal(browser.root.querySelector('#scoreLeft')?.textContent, '3');
});
