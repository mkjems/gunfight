import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientHudOverlay() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/modules/clientHudOverlay.ts'),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });
    const encoded = Buffer.from(transpiled.outputText).toString('base64');
    const module = await import('data:text/javascript;base64,' + encoded);

    return module.ClientHudOverlay;
}

function createConstructors(calls) {
    return {
        GameHud: function (elements) {
            calls.push(['GameHud', elements]);
            this.kind = 'gameHudScreen';
        },
        HighScoresScreen: function (elements) {
            calls.push(['HighScoresScreen', elements]);
            this.kind = 'highScoresScreen';
        },
        LobbyScreen: function (elements) {
            calls.push(['LobbyScreen', elements]);
            this.kind = 'lobbyScreen';
        },
        NameEditorScreen: function (elements) {
            calls.push(['NameEditorScreen', elements]);
            this.kind = 'nameEditorScreen';
        }
    };
}

function createDocument() {
    const elements = {};

    function getElement(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id
            };
        }

        return elements[id];
    }

    return {
        elements: elements,
        getElementById: getElement
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('creates HUD screens from DOM elements', async function () {
    const calls = [];
    const overlayModule = await loadClientHudOverlay();
    const fakeDocument = createDocument();
    const overlay = overlayModule.create({
        document: fakeDocument,
        ...createConstructors(calls)
    });

    assert.equal(overlay.gameHud.id, 'gameHud');
    assert.equal(overlay.lobbyHud.id, 'lobbyHud');
    assert.equal(overlay.gameHudScreen.kind, 'gameHudScreen');
    assert.equal(overlay.highScoresScreen.kind, 'highScoresScreen');
    assert.equal(overlay.lobbyScreen.kind, 'lobbyScreen');
    assert.equal(overlay.nameEditorScreen.kind, 'nameEditorScreen');
    assert.deepEqual(
        plain(
            calls.map(function (call) {
                return [
                    call[0],
                    Object.fromEntries(
                        Object.entries(call[1]).map(function (entry) {
                            return [
                                entry[0],
                                entry[1] && entry[1].id ? entry[1].id : entry[1]
                            ];
                        })
                    )
                ];
            })
        ),
        [
            [
                'GameHud',
                {
                    root: 'gameHud'
                }
            ],
            [
                'HighScoresScreen',
                {
                    lobbyMain: 'lobby-main',
                    playPrompt: 'highScoresPlayPrompt',
                    screen: 'highScoresScreen',
                    table: 'highScoresTable'
                }
            ],
            [
                'LobbyScreen',
                {
                    highScores: 'highScoresScreen',
                    main: 'lobby-main'
                }
            ],
            [
                'NameEditorScreen',
                {
                    editor: 'nameEditor',
                    highScores: 'highScoresScreen',
                    lobbyMain: 'lobby-main'
                }
            ]
        ]
    );
});
