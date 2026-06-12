import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadStateUtilities() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule(
        'input/keysModel.ts',
        'input/keysModel.js',
        tempDirectory
    );
    compileClientModule(
        'input/nameEditor.ts',
        'input/nameEditor.js',
        tempDirectory
    );
    compileClientModule(
        'engine/scoreKeeper.ts',
        'engine/scoreKeeper.js',
        tempDirectory
    );
    compileClientModule(
        'engine/roundIntro.ts',
        'engine/roundIntro.js',
        tempDirectory
    );

    const [keysModule, nameEditorModule, scoreKeeperModule, roundIntroModule] =
        await Promise.all(
            [
                'input/keysModel.js',
                'input/nameEditor.js',
                'engine/scoreKeeper.js',
                'engine/roundIntro.js'
            ].map(function (fileName) {
                return import(
                    pathToFileURL(path.join(tempDirectory, fileName)).href
                );
            })
        );

    return {
        KeysModel: keysModule.KeysModel,
        NameEditor: nameEditorModule.NameEditor,
        RoundIntro: roundIntroModule.RoundIntro,
        ScoreKeeper: scoreKeeperModule.ScoreKeeper
    };
}

function createDocument() {
    const listeners = {
        keydown: [],
        keyup: []
    };

    return {
        listeners,
        addEventListener(eventName, callback) {
            listeners[eventName].push(callback);
        },
        fire(eventName, key, target) {
            const event = {
                defaultPrevented: false,
                key,
                target: target || null,
                preventDefault() {
                    this.defaultPrevented = true;
                }
            };

            listeners[eventName].forEach(function (callback) {
                callback(event);
            });

            return event;
        }
    };
}

test('keys model emits local and socket key events once per press', async function () {
    const { KeysModel } = await loadStateUtilities();
    const document = createDocument();
    const calls = [];
    const model = KeysModel(
        {
            emit(eventName, payload) {
                calls.push(['socket', eventName, payload]);
            }
        },
        'player-1',
        function (keyEvent) {
            calls.push(['local', keyEvent]);
        },
        {
            document
        }
    );

    const down = document.fire('keydown', 'H');
    document.fire('keydown', 'h');
    const up = document.fire('keyup', 'h');

    assert.equal(down.defaultPrevented, true);
    assert.equal(up.defaultPrevented, true);
    assert.equal(model.isDown('h'), false);
    assert.deepEqual(calls, [
        [
            'local',
            {
                action: 'down',
                key: 'h',
                player: 'player-1'
            }
        ],
        [
            'socket',
            'clientKeyEvent',
            {
                action: 'down',
                key: 'h',
                player: 'player-1'
            }
        ],
        [
            'local',
            {
                action: 'up',
                key: 'h',
                player: 'player-1'
            }
        ],
        [
            'socket',
            'clientKeyEvent',
            {
                action: 'up',
                key: 'h',
                player: 'player-1'
            }
        ]
    ]);
});

test('keys model ignores editable targets and gates ready events', async function () {
    const { KeysModel } = await loadStateUtilities();
    const document = createDocument();
    const calls = [];
    const model = KeysModel(
        {
            emit(eventName) {
                calls.push(eventName);
            }
        },
        'player-1',
        function () {},
        {
            canReady() {
                return calls.length > 0;
            },
            document,
            onReady() {
                calls.push('onReady');
            }
        }
    );

    const ignored = document.fire('keydown', 'h', {
        tagName: 'INPUT'
    });

    document.fire('keydown', 'p');
    calls.push('allow');
    document.fire('keydown', 'p');
    document.fire('keydown', 'p');
    document.fire('keyup', 'p');
    model.ready();

    assert.equal(ignored.defaultPrevented, false);
    assert.deepEqual(calls, [
        'allow',
        'clientReady',
        'onReady',
        'clientReady',
        'onReady'
    ]);
});

test('name editor sanitizes, edits, and submits names', async function () {
    const { NameEditor } = await loadStateUtilities();
    const calls = [];
    const editor = NameEditor({
        maxLength: 4,
        onChange() {
            calls.push('change');
        },
        onSubmit(name) {
            calls.push(['submit', name]);
        }
    });

    editor.open('a-ce!');
    editor.select(0, 1);
    editor.select(4, 0);
    editor.handleKeyEvent({
        action: 'down',
        key: 'e'
    });

    assert.deepEqual(editor.getState(), {
        active: false,
        cursorCol: 0,
        cursorRow: 4,
        grid: editor.getState().grid,
        name: 'ACE'
    });
    assert.deepEqual(calls, [
        'change',
        'change',
        'change',
        'change',
        ['submit', 'ACE'],
        'change'
    ]);
});

test('score keeper records scores and deduplicates game results', async function () {
    const { ScoreKeeper } = await loadStateUtilities();
    const scoreKeeper = ScoreKeeper();

    scoreKeeper.addPoint(0);
    scoreKeeper.addPoint(0);
    scoreKeeper.addPoint(1);

    assert.deepEqual(scoreKeeper.getScores(), [2, 1]);
    assert.equal(
        scoreKeeper.getGameOverMessage(
            [
                { slot: 0, name: 'ACE' },
                { slot: 1, name: 'DOC' }
            ],
            function (client) {
                return client.name;
            }
        ),
        'ACE WINS 2-1'
    );

    const model = {
        clients: [
            { slot: 0, name: 'ACE' },
            { slot: 1, name: 'DOC' }
        ],
        gameId: 'G0001',
        roundNumber: 7
    };

    assert.deepEqual(
        scoreKeeper.createGameResult(model, function (client) {
            return client.name;
        }),
        {
            clients: [
                { name: 'ACE', slot: 0 },
                { name: 'DOC', slot: 1 }
            ],
            gameId: 'G0001',
            resultId: 'G0001:7',
            roundNumber: 7,
            scores: [2, 1]
        }
    );
    assert.equal(
        scoreKeeper.createGameResult(model, function (client) {
            return client.name;
        }),
        null
    );
});

test('round intro walks players from spawn edge to their slots', async function () {
    const { RoundIntro } = await loadStateUtilities();
    let timestamp = 1000;
    const calls = [];
    const player = {
        animationFrameTime: 0.1,
        animationFrames: [3, 4],
        frame: 0,
        slot: 0,
        x: 0,
        y: 0,
        getBounds() {
            return {
                minX: 90,
                maxX: 120
            };
        },
        resetTo(slot) {
            calls.push(['resetTo', slot.x, slot.y]);
            this.x = slot.x;
            this.y = slot.y;
        }
    };
    const intro = RoundIntro({
        now() {
            return timestamp;
        },
        players: {
            all: {
                p1: player
            },
            clearKeys() {
                calls.push('clearKeys');
            }
        }
    });

    intro.start();
    timestamp += 1500;
    intro.update();

    assert.deepEqual(calls, ['clearKeys', ['resetTo', 150, 430]]);
    assert.equal(player.x, 150);
    assert.equal(player.y, 430);
    assert.equal(player.frame, 0);
});
