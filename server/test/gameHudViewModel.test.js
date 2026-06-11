import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadGameHudViewModel() {
    const context = {
        GF: {
            ClientScreens: {
                RoundState: {
                    GAME_OVER: 'gameOver',
                    PLAYING: 'playing'
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/GameHudViewModel.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.GameHudViewModel;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('builds game HUD state from scores and round data', function () {
    const viewModel = loadGameHudViewModel();

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

test('shows game over as the timer label', function () {
    const viewModel = loadGameHudViewModel();

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

test('projects hit messages through the camera controller', function () {
    const viewModel = loadGameHudViewModel();

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
