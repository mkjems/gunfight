import assert from 'node:assert/strict';
import test from 'node:test';
import {
    canTransitionPhase,
    createGameModel,
    LEGAL_PHASE_TRANSITIONS
} from '../gameModules/gfmodel.js';

function createManualModel() {
    let timestamp = 1000;

    return {
        model: createGameModel({
            now: function () {
                return timestamp;
            }
        }),
        setTime(nextTimestamp) {
            timestamp = nextTimestamp;
        }
    };
}

function snapshot(model) {
    const current = model.getModel();

    return {
        matchState: current.matchState,
        phase: current.phase,
        phaseEndsAt: current.phaseEndsAt,
        duelNumber: current.duelNumber,
        scores: current.scores,
        version: current.version
    };
}

test('documents legal lifecycle phase transitions', function () {
    assert.deepEqual(LEGAL_PHASE_TRANSITIONS, {
        waiting: ['readying', 'closed'],
        readying: ['waiting', 'readyCountdown', 'closed'],
        readyCountdown: ['duelIntro', 'abandoned', 'closed'],
        duelIntro: ['playing', 'gameOver', 'abandoned', 'closed'],
        playing: ['hitPause', 'gameOver', 'abandoned', 'closed'],
        hitPause: ['duelIntro', 'gameOver', 'abandoned', 'closed'],
        gameOver: ['waiting', 'readying', 'abandoned', 'closed'],
        abandoned: ['closed'],
        closed: []
    });
    assert.equal(canTransitionPhase('readying', 'readyCountdown'), true);
    assert.equal(canTransitionPhase('waiting', 'readyCountdown'), false);
    assert.equal(canTransitionPhase('gameOver', 'playing'), false);
    assert.equal(canTransitionPhase('closed', 'waiting'), false);
});

test('covers legal and illegal lifecycle transitions for every phase', function () {
    const phases =
        /** @type {Array<import('../../shared/contracts.js').GamePhase>} */ (
            Object.keys(LEGAL_PHASE_TRANSITIONS)
        );

    phases.forEach(function (fromPhase) {
        phases.forEach(function (toPhase) {
            assert.equal(
                canTransitionPhase(fromPhase, toPhase),
                LEGAL_PHASE_TRANSITIONS[fromPhase].includes(toPhase),
                fromPhase + ' -> ' + toPhase
            );
        });
    });
});

test('rejects lifecycle commands that are illegal for the current phase', function () {
    const { model } = createManualModel();
    const firstClient = model.getNewClient();
    const secondClient = model.getNewClient();
    const before = snapshot(model);

    assert.equal(model.startMatch(), false);
    assert.equal(model.enterPlaying('early'), false);
    assert.equal(
        model.recordDuelResult({
            duelNumber: 1,
            targetId: secondClient.id,
            winnerId: firstClient.id
        }),
        false
    );
    assert.equal(model.finishHitPause('early'), false);
    assert.equal(model.finishMatch('early'), false);
    assert.equal(model.returnToLobbyAfterGameOver(), false);
    assert.deepEqual(snapshot(model), before);
});

test('keeps model version unchanged for duplicate ready intents', function () {
    const { model } = createManualModel();
    const firstClient = model.getNewClient();
    model.getNewClient();

    assert.equal(model.readyClient(firstClient), true);

    const before = snapshot(model);

    assert.equal(model.readyClient(firstClient), false);
    assert.deepEqual(snapshot(model), before);
});
