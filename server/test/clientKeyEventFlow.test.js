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

async function loadClientKeyEventFlow() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientGameplayInput.ts',
        'clientGameplayInput.js',
        tempDirectory
    );
    compileClientModule(
        'clientKeyEventFlow.ts',
        'clientKeyEventFlow.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientKeyEventFlow.js')).href
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
            roundState: 'playing',
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
        roundState: 'waiting'
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
        roundState: 'waiting'
    });

    assert.equal(flow.handle(options), false);
    assert.deepEqual(plain(calls), [
        ['nameEditor.handleKeyEvent', 'h'],
        'renderHud'
    ]);
    assert.deepEqual(gameplayCalls, []);
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
                    player: options.player,
                    roundState: options.roundState
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
            player: {
                id: 'p1'
            },
            roundState: 'playing'
        }
    ]);
    assert.deepEqual(calls, ['onBulletFired']);
});
