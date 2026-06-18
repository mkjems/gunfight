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

async function loadClientKeyEventFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientGameplayInput.ts',
        'flows/clientGameplayInput.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientKeyEventFlow.ts',
        'flows/clientKeyEventFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientKeyEventFlow.js'))
            .href
    );

    return module.ClientKeyEventFlow;
}

function createOptions(overrides = {}) {
    const calls = [];
    const player = {
        id: 'p1'
    };

    return {
        calls,
        options: {
            ammo: {},
            bullets: {},
            isLocalClientWaiting() {
                calls.push('isLocalClientWaiting');

                return true;
            },
            keyEvent: {
                key: 'h',
                player: 'p1'
            },
            gameplayInput: {
                handle(options) {
                    calls.push(['gameplayInput.handle', options.keyEvent.key]);
                }
            },
            nameEditor: null,
            onGunFired() {
                calls.push('onGunFired');
            },
            onWaitingFire() {
                calls.push('onWaitingFire');
            },
            onBulletFired() {
                calls.push('onBulletFired');
            },
            onEmptyGun() {
                calls.push('onEmptyGun');
            },
            player: player,
            playerId: 'p1',
            renderHud() {
                calls.push('renderHud');
            },
            duelState: 'playing',
            ...overrides
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('blocks local edit key while the local client is not waiting', async function () {
    const gameplayCalls = [];
    const flow = await loadClientKeyEventFlow();
    const { calls, options } = createOptions({
        isLocalClientWaiting() {
            calls.push('isLocalClientWaiting');

            return false;
        },
        keyEvent: {
            key: 'e',
            player: 'p1'
        },
        duelState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(calls, ['isLocalClientWaiting']);
    assert.deepEqual(gameplayCalls, []);
});

test('routes waiting local key events through the active name editor', async function () {
    const gameplayCalls = [];
    const flow = await loadClientKeyEventFlow();
    const { calls, options } = createOptions({
        keyEvent: {
            key: 'h',
            player: 'p1'
        },
        nameEditor: {
            handleKeyEvent(keyEvent) {
                calls.push(['nameEditor.handleKeyEvent', keyEvent.key]);

                return false;
            }
        },
        duelState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(plain(calls), [
        ['nameEditor.handleKeyEvent', 'h'],
        'renderHud'
    ]);
    assert.deepEqual(gameplayCalls, []);
});

test('opens and closes high scores from local waiting navigation', async function () {
    const flow = await loadClientKeyEventFlow();
    const { calls, options } = createOptions({
        keyEvent: {
            action: 'down',
            key: 's',
            player: 'p1'
        },
        returnToLobby() {
            calls.push('returnToLobby');
        },
        duelState: 'waiting',
        showHighScores() {
            calls.push('showHighScores');
        }
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(calls, [
        'isLocalClientWaiting',
        'showHighScores',
        'renderHud'
    ]);

    calls.length = 0;
    assert.equal(
        flow.handle({
            ...options,
            highScoresVisible: true
        }),
        false
    );
    assert.deepEqual(calls, [
        'isLocalClientWaiting',
        'returnToLobby',
        'renderHud'
    ]);
});

test('blocks other local waiting keys while high scores are visible', async function () {
    const flow = await loadClientKeyEventFlow();
    const { calls, options } = createOptions({
        highScoresVisible: true,
        keyEvent: {
            action: 'down',
            key: 'h',
            player: 'p1'
        },
        duelState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(calls, ['isLocalClientWaiting']);
});

test('delegates gameplay key events to gameplay input', async function () {
    const gameplayCalls = [];
    const flow = await loadClientKeyEventFlow();
    const { calls, options } = createOptions({
        gameplayInput: {
            handle(options) {
                gameplayCalls.push({
                    keyEvent: options.keyEvent,
                    onGunFired: Boolean(options.onGunFired),
                    onWaitingFire: Boolean(options.onWaitingFire),
                    player: options.player,
                    duelState: options.duelState
                });
                if (options.keyEvent.key === ' ') {
                    options.onBulletFired();
                }
            }
        },
        keyEvent: {
            key: ' ',
            player: 'p1'
        }
    });

    assert.equal(flow.handle(options), undefined);
    assert.deepEqual(plain(gameplayCalls), [
        {
            keyEvent: {
                key: ' ',
                player: 'p1'
            },
            onGunFired: true,
            onWaitingFire: true,
            player: {
                id: 'p1'
            },
            duelState: 'playing'
        }
    ]);
    assert.deepEqual(calls, ['onBulletFired']);
});
