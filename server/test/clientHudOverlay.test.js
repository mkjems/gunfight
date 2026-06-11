import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientHudOverlay(calls) {
    const context = {
        GF: {
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
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientHudOverlay.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientHudOverlay;
}

function createDocument() {
    const elements = {};

    function getElement(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                parentNode: {
                    id: id + '-parent'
                },
                closest(selector) {
                    return {
                        id: id + ':' + selector
                    };
                }
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

test('creates HUD screens from DOM elements', function () {
    const calls = [];
    const overlayModule = loadClientHudOverlay(calls);
    const fakeDocument = createDocument();
    const overlay = overlayModule.create({
        document: fakeDocument
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
                    hitMessage: 'hitMessage',
                    roundMessage: 'roundMessage',
                    scoreLeft: 'scoreLeft',
                    scoreRight: 'scoreRight',
                    timer: 'roundTimer'
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
                    controls: 'lobbyControlsText',
                    controlsSection: 'lobbyControlsText:.lobby-section',
                    editPrompt: 'lobbyEditPrompt',
                    editPromptSection: 'lobbyEditPrompt:.lobby-section',
                    highScores: 'highScoresScreen',
                    identity: 'lobbyIdentity',
                    main: 'lobby-main',
                    playPrompt: 'lobbyPlayPrompt',
                    slots: 'lobbySlots'
                }
            ],
            [
                'NameEditorScreen',
                {
                    editor: 'nameEditor',
                    grid: 'nameEditorGrid',
                    help: 'nameEditorHelp',
                    highScores: 'highScoresScreen',
                    lobbyMain: 'lobby-main',
                    value: 'nameEditorValue'
                }
            ]
        ]
    );
});

test('finds lobby section through closest or parent fallback', function () {
    const overlayModule = loadClientHudOverlay([]);
    const parent = {
        id: 'parent'
    };

    assert.equal(
        overlayModule.getLobbySection({
            closest(selector) {
                return selector;
            },
            parentNode: parent
        }),
        '.lobby-section'
    );
    assert.equal(
        overlayModule.getLobbySection({
            parentNode: parent
        }),
        parent
    );
    assert.equal(overlayModule.getLobbySection(null), null);
});
