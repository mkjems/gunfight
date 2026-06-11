import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientRoundState() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientRoundState.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientRoundState;
}

test('tracks round clock and messages', function () {
    const ClientRoundState = loadClientRoundState();
    let now = 1000;
    const state = new ClientRoundState({
        getTime() {
            return now;
        }
    });

    assert.equal(state.getSecondsLeft(70), 70);
    state.setRoundEndsAt(3500);
    assert.equal(state.getSecondsLeft(70), 3);
    assert.equal(state.hasMatchTimeExpired(), false);

    now = 3500;
    assert.equal(state.getSecondsLeft(70), 0);
    assert.equal(state.hasMatchTimeExpired(), true);

    state.setRoundMessage('DRAW!');
    assert.equal(state.getRoundMessage(), 'DRAW!');
    state.setRoundMessage('');
    assert.equal(state.getRoundMessage(), '');
});

test('tracks hit state and consumes advance-round requests', function () {
    const ClientRoundState = loadClientRoundState();
    const state = new ClientRoundState();
    const hitMessage = {
        targetId: 'player-2',
        text: 'Got me!'
    };

    state.setHitMessage(hitMessage);
    state.setAdvanceRoundAfterHit(true);

    assert.equal(state.getHitMessage(), hitMessage);
    assert.equal(state.shouldAdvanceRoundAfterHit(), true);
    assert.equal(state.consumeAdvanceRoundAfterHit(), true);
    assert.equal(state.consumeAdvanceRoundAfterHit(), false);

    state.clearHitMessage();
    assert.equal(state.getHitMessage(), null);
});

test('resets obstacle damage only for full round resets', function () {
    const ClientRoundState = loadClientRoundState();
    const state = new ClientRoundState();

    state.damageObstacle('wagon');
    state.damageObstacle('wagon');
    state.setRoundEndsAt(2000);
    state.setHitMessage({ text: 'hit' });
    state.setAdvanceRoundAfterHit(true);

    state.clearRoundPauseFlags();

    assert.equal(state.getObstacleDamage('wagon'), 2);
    assert.equal(state.getRoundEndsAt(), null);
    assert.equal(state.getHitMessage(), null);
    assert.equal(state.shouldAdvanceRoundAfterHit(), false);

    state.resetRoundFlags();

    assert.equal(state.getObstacleDamage('wagon'), 0);
});

test('records scenario start time', function () {
    const ClientRoundState = loadClientRoundState();
    const state = new ClientRoundState({
        getTime() {
            return 1234;
        }
    });

    assert.equal(state.getScenarioStartedAt(), null);
    state.startScenario();
    assert.equal(state.getScenarioStartedAt(), 1234);
});
