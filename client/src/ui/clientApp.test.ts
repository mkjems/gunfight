import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { afterEach, test } from 'vitest';
import { Screen } from '../state/clientScreens.js';
import { ClientAppMount } from './clientApp.js';

type TestElement = HTMLElement & {
    dispatchEvent: (event: Event) => boolean;
};

type Browser = {
    createElement: (tagName?: string) => HTMLElement;
    window: Window;
};

type PointerEventWindow = Window & {
    PointerEvent: typeof PointerEvent;
};

const testGlobal = globalThis as typeof globalThis & {
    document?: Document;
};

afterEach(function () {
    Reflect.deleteProperty(testGlobal, 'document');
});

function createBrowser(): Browser {
    const window = new Window();

    testGlobal.document = window.document as unknown as Document;

    return {
        createElement(tagName = 'div') {
            return window.document.createElement(
                tagName
            ) as unknown as HTMLElement;
        },
        window
    };
}

function childTexts(element: Element) {
    return Array.from(element.children).map(function (child) {
        return child.textContent;
    });
}

function query(element: ParentNode, selector: string) {
    const result = element.querySelector(selector);

    assert.ok(result);

    return result as TestElement;
}

function createPointerDown(window: Window): Event {
    return new (window as PointerEventWindow).PointerEvent('pointerdown', {
        cancelable: true
    }) as unknown as Event;
}

test('renders game HUD scores, timer, round text, and hit messages through the app root', function () {
    const browser = createBrowser();
    const root = browser.createElement();
    const app = ClientAppMount.create({ root });

    app.render({
        activeScreen: Screen.GAME,
        gameHud: {
            ammoDisplays: [
                {
                    count: 3,
                    side: 'left'
                },
                {
                    count: 2,
                    side: 'right'
                }
            ],
            hitMessage: {
                text: 'HIT!',
                x: 475,
                y: 320
            },
            leftName: 'ACE',
            leftScore: 2,
            rightName: 'DOC',
            rightScore: 1,
            roundMessage: 'DRAW!',
            timerLabel: 67
        }
    });

    assert.equal(query(root, '#gameHud').hidden, false);
    assert.equal(query(root, '#lobbyHud').hidden, true);
    assert.deepEqual(childTexts(query(root, '#scoreLeft')), ['2', 'ACE']);
    assert.deepEqual(childTexts(query(root, '#scoreRight')), ['DOC', '1']);
    assert.equal(query(root, '#roundTimer').textContent, '67');
    assert.equal(query(root, '#roundMessage').textContent, 'DRAW!');
    assert.equal(query(root, '#ammoRow').hidden, false);
    assert.equal(query(root, '#ammoLeft').children.length, 6);
    assert.equal(query(root, '#ammoRight').children.length, 6);

    const hitMessage = query(root, '#hitMessage');
    assert.equal(hitMessage.textContent, 'HIT!');
    assert.equal(hitMessage.style.left, '50%');
    assert.equal(hitMessage.style.top, '50%');
    assert.equal(hitMessage.hidden, false);

    app.render({
        activeScreen: Screen.GAME,
        gameHud: {}
    });

    assert.equal(query(root, '#scoreLeft').textContent, '0');
    assert.equal(query(root, '#scoreRight').textContent, '0');
    assert.equal(query(root, '#roundTimer').textContent, '');
    assert.equal(query(root, '#roundMessage').textContent, '');
    assert.equal(query(root, '#ammoRow').hidden, true);
    assert.equal(query(root, '#hitMessage').hidden, true);
});

test('renders high-score table rows with ten ranked places through the app root', function () {
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
        query(root, '#highScoresTable').textContent?.includes('NO SCORES YET'),
        false
    );
});

test('renders mobile high scores with five rows and touch actions underneath', function () {
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

test('renders lobby screen sections through the app root', function () {
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
                    variant: 'player-status',
                    x: 12.5,
                    y: 80
                }
            ],
            previousResult: {
                leftName: 'ACE',
                leftScore: 3,
                rightName: 'DOC',
                rightScore: 2,
                timerLabel: 'GAME OVER'
            },
            showControls: true,
            showEditPrompt: true
        }
    });

    const main = query(root, '#lobby-main');
    const previousResult = query(main, '#lobbyPreviousResult');
    const controls = query(main, '#lobbyControlsText');
    const editPrompt = query(main, '#lobbyEditPrompt');
    const labels = query(main, '#lobbyPlayerLabels');
    const highScoresPrompt = query(main, '#lobbyHighScoresPrompt');
    const playPrompt = query(main, '#lobbyPlayPrompt');

    assert.equal(main.hidden, false);
    assert.equal(query(root, '#highScoresScreen').hidden, true);
    assert.deepEqual(
        childTexts(query(previousResult, '#lobbyPreviousScoreLeft')),
        ['3', 'ACE']
    );
    assert.equal(
        query(previousResult, '#lobbyPreviousRoundTimer').textContent,
        'GAME OVER'
    );
    assert.deepEqual(
        childTexts(query(previousResult, '#lobbyPreviousScoreRight')),
        ['DOC', '2']
    );
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
        'lobby-player-label is-player-status negative-text'
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
        lobby: {
            controls: ['MOVE', 'FIRE'],
            showControls: true
        }
    });

    assert.equal(query(main, '#lobbyEditPrompt').hidden, false);
    assert.equal(
        query(main, '#lobbyEditPrompt').className,
        'lobbyPromptSlot is-reserved-hidden'
    );
    assert.equal(
        query(main, '#lobbyEditPrompt').getAttribute('aria-hidden'),
        'true'
    );
    assert.equal(query(main, '#lobbyHighScoresPrompt').hidden, false);
    assert.equal(query(main, '#lobbyPlayPrompt').hidden, false);

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        lobby: {}
    });

    assert.equal(query(main, '#lobbyControlsText').children.length, 0);
    assert.equal(query(main, '#lobbyControlsText').hidden, true);
    assert.equal(query(main, '#lobbyEditPrompt').hidden, true);
    assert.equal(query(main, '#lobbyEditPrompt').textContent, '');
    assert.equal(query(main, '#lobbyHighScoresPrompt').hidden, true);
    assert.equal(query(main, '#lobbyHighScoresPrompt').textContent, '');
    assert.equal(query(main, '#lobbyPlayPrompt').hidden, true);
    assert.equal(query(main, '#lobbyPlayPrompt').textContent, '');
    assert.equal(root.querySelector('#lobbyPreviousResult'), null);
});

test('skips virtual-DOM work when app render props are value-equal', function () {
    const browser = createBrowser();
    const root = browser.createElement();
    const renders: string[] = [];
    const app = ClientAppMount.create({
        afterRender() {
            renders.push('rendered');
        },
        root
    });

    function props(timerLabel: number) {
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

test('renders touch lobby buttons and dispatches tap actions through the app root', function () {
    const browser = createBrowser();
    const actions: string[] = [];
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

    const primaryRow = query(root, '#touchLobbyPrimaryRow');
    const secondaryRow = query(root, '#touchLobbySecondaryRow');
    const backRow = query(root, '#touchLobbyBackRow');
    const editButton = query(root, '#touchEditButton');
    const highScoresButton = query(root, '#touchHighScoresButton');
    const playButton = query(root, '#touchPlayButton');
    const backButton = query(root, '#touchBackButton');
    assert.equal(primaryRow.hidden, false);
    assert.equal(secondaryRow.hidden, false);
    assert.equal(backRow.hidden, true);
    assert.deepEqual(childTexts(secondaryRow), ['EDIT NAME', 'HIGH SCORES']);
    assert.equal(editButton.textContent, 'EDIT NAME');
    assert.equal(highScoresButton.textContent, 'HIGH SCORES');
    assert.equal(playButton.textContent, 'PLAY GUNFIGHT');
    assert.equal(backButton.textContent, 'BACK TO LOBBY');
    assert.equal(editButton.hidden, false);
    assert.equal(highScoresButton.hidden, false);
    assert.equal(playButton.hidden, false);
    assert.equal(backButton.hidden, true);
    assert.equal(playButton.className, 'negative-button');

    const pointerDown = createPointerDown(browser.window);
    playButton.dispatchEvent(pointerDown);
    highScoresButton.dispatchEvent(createPointerDown(browser.window));
    editButton.dispatchEvent(createPointerDown(browser.window));

    assert.equal(pointerDown.defaultPrevented, true);
    assert.deepEqual(actions, ['play', 'scores', 'edit']);

    app.render({
        activeScreen: Screen.LOBBY_MAIN,
        touchControls: {
            enabled: true,
            lobby: {
                showMainButtons: true,
                showPlayButton: false,
                visible: true
            }
        }
    });

    assert.equal(query(root, '#touchLobbyPrimaryRow').hidden, true);
    assert.equal(query(root, '#touchLobbySecondaryRow').hidden, false);
    assert.equal(query(root, '#touchEditButton').hidden, false);
    assert.equal(query(root, '#touchHighScoresButton').hidden, false);
    assert.equal(query(root, '#touchPlayButton').hidden, true);

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
    assert.equal(query(root, '#touchLobbyPrimaryRow').hidden, true);
    assert.equal(query(root, '#touchLobbySecondaryRow').hidden, true);
    assert.equal(query(root, '#touchLobbyBackRow').hidden, false);
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

test('renders gameplay touch controls markup and keeps imperative styles', function () {
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

test('renders name editor grid and dispatches pointer selections through the app root', function () {
    const browser = createBrowser();
    const selected: number[][] = [];
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
    assert.deepEqual(childTexts(grid.children[0]), ['A', 'B']);
    assert.deepEqual(childTexts(grid.children[1]), ['OK']);

    const selectedKey = grid.children[0].children[1] as TestElement;
    assert.equal(selectedKey.tagName, 'BUTTON');
    assert.equal(selectedKey.textContent, 'B');

    const pointerDown = createPointerDown(browser.window);
    selectedKey.dispatchEvent(pointerDown);

    assert.equal(pointerDown.defaultPrevented, true);
    assert.deepEqual(selected, [[0, 1]]);
});
