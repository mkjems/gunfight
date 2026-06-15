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

async function loadClientGameRuntime() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'runtime/game/payloadGuards.ts',
        'runtime/game/payloadGuards.js',
        tempDirectory
    );
    compileClientModule(
        'runtime/game/runtime.ts',
        'runtime/game/runtime.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'runtime/game/runtime.js')).href
    );

    return module.ClientGameRuntime;
}

function createRuntime(ClientGameRuntime) {
    const runtime = new ClientGameRuntime({
        dependencies: {
            ClientLobbyFlow: {
                enter() {}
            },
            ClientRoundRitual: {
                start() {}
            },
            ClientScreens: {
                RoundState: {
                    GAME_OVER: 'gameOver',
                    PLAYING: 'playing',
                    WAITING: 'waiting'
                }
            }
        },
        document: {},
        ImageCtor: function ImageCtor() {},
        window: {}
    });

    runtime.bullets = {};
    runtime.roundData = {
        hasMatchTimeExpired() {
            return false;
        }
    };
    runtime.roundIntro = {};
    runtime.scoreKeeper = {};
    runtime.timers = {};

    return runtime;
}

test('keeps the active scenario visible until the next round ritual starts', async function () {
    const ClientGameRuntime = await loadClientGameRuntime();
    const runtime = createRuntime(ClientGameRuntime);
    const firstScenario = { id: 'first' };
    const nextScenario = { id: 'next' };

    runtime.latestModel = {
        clients: [],
        currentScenario: firstScenario
    };
    runtime.startRoundRitual({ resetScores: false });

    runtime.latestModel = {
        clients: [],
        currentScenario: nextScenario
    };

    assert.equal(runtime.getCurrentScenario(), firstScenario);

    runtime.startRoundRitual({ resetScores: false });

    assert.equal(runtime.getCurrentScenario(), nextScenario);
});
