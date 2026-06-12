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

async function loadGameHudViewModel() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'ui/viewModels/gameHudViewModel.ts',
        'ui/viewModels/gameHudViewModel.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(
            path.join(tempDirectory, 'ui/viewModels/gameHudViewModel.js')
        ).href
    );

    return module.GameHudViewModel;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds game HUD state from scores and round data', async function () {
    const viewModel = await loadGameHudViewModel();

    assert.deepEqual(
        plain(
            viewModel.getState({
                camera: {},
                cameraController: {
                    worldToHudPoint() {
                        throw new Error('hit projection should not run');
                    }
                },
                defaultSeconds: 70,
                players: { all: {} },
                roundData: {
                    getHitMessage() {
                        return null;
                    },
                    getRoundMessage() {
                        return 'DRAW!';
                    },
                    getSecondsLeft(defaultSeconds) {
                        return defaultSeconds - 3;
                    }
                },
                roundState: 'playing',
                scoreKeeper: {
                    getScore(slot) {
                        return slot + 2;
                    }
                }
            })
        ),
        {
            leftScore: 2,
            rightScore: 3,
            timerLabel: 67,
            roundMessage: 'DRAW!',
            hitMessage: null
        }
    );
});

test('shows game over as the timer label', async function () {
    const viewModel = await loadGameHudViewModel();

    assert.equal(
        viewModel.getTimerLabel({
            defaultSeconds: 70,
            roundData: {
                getSecondsLeft() {
                    return 12;
                }
            },
            roundState: 'gameOver'
        }),
        'GAME OVER'
    );
});

test('projects hit messages through the camera controller', async function () {
    const viewModel = await loadGameHudViewModel();

    assert.deepEqual(
        plain(
            viewModel.getHitMessage({
                camera: { id: 'camera' },
                cameraController: {
                    worldToHudPoint(options) {
                        assert.equal(options.camera.id, 'camera');
                        assert.equal(options.roundState, 'playing');
                        assert.equal(options.x, 120);
                        assert.equal(options.y, 80);

                        return {
                            x: 22,
                            y: 33
                        };
                    }
                },
                players: {
                    all: {
                        p2: {
                            x: 120,
                            y: 180
                        }
                    }
                },
                roundData: {
                    getHitMessage() {
                        return {
                            targetId: 'p2',
                            text: 'Got me!'
                        };
                    }
                },
                roundState: 'playing'
            })
        ),
        {
            text: 'Got me!',
            x: 22,
            y: 33
        }
    );
});
