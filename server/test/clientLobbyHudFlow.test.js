import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientLobbyHudFlow(screen, viewModel = {}) {
    const context = {
        GF: {
            ClientScreens: {
                Screen: {
                    HIGH_SCORES: 'highScores',
                    LOBBY_EDIT_NAME: 'lobbyEditName',
                    LOBBY_MAIN: 'lobbyMain'
                },
                getActiveScreen() {
                    return screen;
                }
            },
            ClientLobbyViewModel: {
                getLobbyViewModel(options) {
                    return {
                        model: options.model,
                        playerId: options.playerId,
                        view: 'lobby'
                    };
                },
                shouldShowHighScoresScreen() {
                    return !!viewModel.highScoresVisible;
                },
                shouldShowLobbyPrompt() {
                    return viewModel.showLobbyPrompt !== false;
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/ClientLobbyHudFlow.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientLobbyHudFlow;
}

function createRenderOptions(overrides = {}) {
    const calls = [];
    const elements = {
        canvas: {},
        gameHud: {},
        hudCanvas: {},
        lobbyHud: {}
    };
    const options = {
        ...elements,
        highScores: [{ name: 'Ada' }],
        highScoresScreen: {
            render(options) {
                calls.push(['highScoresScreen.render', options]);
            }
        },
        isTouchInterface() {
            return false;
        },
        lobbyScreen: {
            clear() {
                calls.push('lobbyScreen.clear');
            },
            render(viewModel) {
                calls.push(['lobbyScreen.render', viewModel]);
            }
        },
        localReadyRequested: false,
        model: {
            gameId: 'game-1'
        },
        nameEditor: {
            getState() {
                return {
                    name: 'ADA'
                };
            },
            isActive() {
                return false;
            },
            select(rowIndex, colIndex) {
                calls.push(['nameEditor.select', rowIndex, colIndex]);
            }
        },
        nameEditorScreen: {
            hide() {
                calls.push('nameEditorScreen.hide');
            },
            render(options) {
                calls.push(['nameEditorScreen.render', options]);
            }
        },
        onNameEditorSelect(rowIndex, colIndex) {
            calls.push(['onNameEditorSelect', rowIndex, colIndex]);
        },
        playerId: 'p1',
        roundState: 'waiting',
        ...overrides
    };

    return {
        calls,
        elements,
        options: options
    };
}

function plain(value) {
    return JSON.parse(
        JSON.stringify(value, function (key, value) {
            return typeof value === 'function' ? 'function' : value;
        })
    );
}

test('renders lobby main through the lobby screen', function () {
    const flow = loadClientLobbyHudFlow('lobbyMain');
    const { calls, elements, options } = createRenderOptions();

    assert.equal(flow.render(options), 'lobbyMain');
    assert.deepEqual(plain(calls), [
        'nameEditorScreen.hide',
        [
            'lobbyScreen.render',
            {
                model: {
                    gameId: 'game-1'
                },
                playerId: 'p1',
                view: 'lobby'
            }
        ]
    ]);
    assert.equal(elements.gameHud.hidden, true);
    assert.equal(elements.lobbyHud.hidden, false);
    assert.equal(elements.canvas.hidden, false);
    assert.equal(elements.hudCanvas.hidden, false);
});

test('renders high scores with keyboard play prompt', function () {
    const flow = loadClientLobbyHudFlow('highScores');
    const { calls, options } = createRenderOptions();

    assert.equal(flow.render(options), 'highScores');
    assert.deepEqual(plain(calls), [
        'nameEditorScreen.hide',
        [
            'highScoresScreen.render',
            {
                playPrompt: 'PRESS P TO PLAY',
                rows: [
                    {
                        name: 'Ada'
                    }
                ]
            }
        ]
    ]);
});

test('renders name editor and passes selection callback', function () {
    const flow = loadClientLobbyHudFlow('lobbyEditName');
    const { calls, elements, options } = createRenderOptions();

    assert.equal(flow.render(options), 'lobbyEditName');

    const renderCall = calls[1];
    assert.equal(renderCall[0], 'nameEditorScreen.render');
    assert.deepEqual(renderCall[1].state, {
        name: 'ADA'
    });
    assert.deepEqual(plain(renderCall[1].helpLines), [
        'H J K L MOVE',
        'SPACE SELECT',
        'E DONE'
    ]);

    renderCall[1].onSelect(1, 2);

    assert.deepEqual(plain(calls), [
        'lobbyScreen.clear',
        [
            'nameEditorScreen.render',
            {
                helpLines: ['H J K L MOVE', 'SPACE SELECT', 'E DONE'],
                onSelect: 'function',
                state: {
                    name: 'ADA'
                }
            }
        ],
        ['onNameEditorSelect', 1, 2]
    ]);
    assert.equal(elements.canvas.hidden, true);
    assert.equal(elements.hudCanvas.hidden, true);
});
