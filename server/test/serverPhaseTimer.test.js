import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceTimedGamePhase } from '../gameModules/serverPhaseTimer.js';

/** @typedef {import('../../shared/contracts.js').GamePhase} GamePhase */
/** @typedef {import('../../shared/contracts.js').GameResultPayload} GameResultPayload */
/** @typedef {import('../../shared/contracts.js').PublicGameModel} PublicGameModel */

/**
 * @param {Partial<PublicGameModel>} [modelOverrides]
 */
function createTimedPhaseLobby(modelOverrides = {}) {
    const calls = [];
    const game = { id: 'G0001' };
    /** @type {PublicGameModel} */
    let model = {
        clients: [],
        currentScenario: null,
        gameId: 'G0001',
        matchState: 'playing',
        message: '',
        phase: 'readyCountdown',
        phaseStartedAt: 1000,
        playerLimit: 2,
        duelNumber: 1,
        scores: [0, 0],
        version: 7,
        ...modelOverrides
    };

    return {
        calls: calls,
        game: game,
        lobby: {
            enterPlaying(activeGame) {
                calls.push(['enterPlaying', activeGame.id]);
                return { clients: [], resultId: 'entered', scores: [0, 0] };
            },
            finishHitPause(activeGame) {
                calls.push(['finishHitPause', activeGame.id]);
                return { clients: [], resultId: 'hit', scores: [1, 0] };
            },
            finishMatch(activeGame) {
                calls.push(['finishMatch', activeGame.id]);
                return { clients: [], resultId: 'match', scores: [1, 0] };
            },
            getGame(gameId) {
                calls.push(['getGame', gameId]);
                return gameId === game.id ? game : null;
            },
            getModel(activeGame) {
                calls.push(['getModel', activeGame.id]);
                return model;
            },
            returnToLobbyAfterGameOver(activeGame) {
                calls.push(['returnToLobbyAfterGameOver', activeGame.id]);
                return true;
            },
            startMatch(activeGame) {
                calls.push(['startMatch', activeGame.id]);
                return true;
            }
        },
        setModel(nextModel) {
            model = { ...model, ...nextModel };
        }
    };
}

test('ignores stale timed phase callbacks by version', function () {
    const harness = createTimedPhaseLobby({
        phase: 'readyCountdown',
        version: 8
    });

    const result = advanceTimedGamePhase({
        lobby: harness.lobby,
        gameId: harness.game.id,
        phase: 'readyCountdown',
        version: 7
    });

    assert.deepEqual(result, {
        advanced: false,
        game: harness.game,
        result: null
    });
    assert.deepEqual(harness.calls, [
        ['getGame', 'G0001'],
        ['getModel', 'G0001']
    ]);
});

test('ignores stale timed phase callbacks by phase', function () {
    const harness = createTimedPhaseLobby({
        phase: 'playing',
        version: 7
    });

    const result = advanceTimedGamePhase({
        lobby: harness.lobby,
        gameId: harness.game.id,
        phase: 'readyCountdown',
        version: 7
    });

    assert.deepEqual(result, {
        advanced: false,
        game: harness.game,
        result: null
    });
    assert.deepEqual(harness.calls, [
        ['getGame', 'G0001'],
        ['getModel', 'G0001']
    ]);
});

test('routes fresh timed phase callbacks to the matching lobby command', function () {
    /** @type {Array<{phase: GamePhase; calls: string[][]; result: GameResultPayload | null}>} */
    const examples = [
        {
            phase: 'readyCountdown',
            calls: [['startMatch', 'G0001']],
            result: null
        },
        {
            phase: 'duelIntro',
            calls: [['enterPlaying', 'G0001']],
            result: { clients: [], resultId: 'entered', scores: [0, 0] }
        },
        {
            phase: 'playing',
            calls: [['finishMatch', 'G0001']],
            result: { clients: [], resultId: 'match', scores: [1, 0] }
        },
        {
            phase: 'hitPause',
            calls: [['finishHitPause', 'G0001']],
            result: { clients: [], resultId: 'hit', scores: [1, 0] }
        },
        {
            phase: 'gameOver',
            calls: [['returnToLobbyAfterGameOver', 'G0001']],
            result: null
        }
    ];

    examples.forEach(function (example) {
        const harness = createTimedPhaseLobby({
            phase: example.phase,
            version: 7
        });

        const result = advanceTimedGamePhase({
            lobby: harness.lobby,
            gameId: harness.game.id,
            phase: example.phase,
            version: 7
        });

        assert.deepEqual(result, {
            advanced: true,
            game: harness.game,
            result: example.result
        });
        assert.deepEqual(harness.calls, [
            ['getGame', 'G0001'],
            ['getModel', 'G0001'],
            ...example.calls
        ]);
    });
});
