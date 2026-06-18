import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientDuelState() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/state/clientDuelState.ts'),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });
    const encoded = Buffer.from(transpiled.outputText).toString('base64');
    const module = await import('data:text/javascript;base64,' + encoded);

    return module.ClientDuelState;
}

test('tracks duel clock and messages', async function () {
    const ClientDuelState = await loadClientDuelState();
    let now = 1000;
    const state = new ClientDuelState({
        getTime() {
            return now;
        }
    });

    assert.equal(state.getSecondsLeft(70), 70);
    state.setMatchEndsAt(3500);
    assert.equal(state.getSecondsLeft(70), 3);

    now = 3500;
    assert.equal(state.getSecondsLeft(70), 0);

    state.setDuelMessage('DRAW!');
    assert.equal(state.getDuelMessage(), 'DRAW!');
    state.setDuelMessage('');
    assert.equal(state.getDuelMessage(), '');
});

test('tracks hit state', async function () {
    const ClientDuelState = await loadClientDuelState();
    const state = new ClientDuelState();
    const hitMessage = {
        targetId: 'player-2',
        text: 'Got me!'
    };

    state.setHitMessage(hitMessage);

    assert.equal(state.getHitMessage(), hitMessage);

    state.clearHitMessage();
    assert.equal(state.getHitMessage(), null);
});

test('resets obstacle damage only for full duel resets', async function () {
    const ClientDuelState = await loadClientDuelState();
    const state = new ClientDuelState();

    state.damageObstacle('wagon');
    state.damageObstacle('wagon');
    state.setMatchEndsAt(2000);
    state.setHitMessage({ text: 'hit' });

    state.clearDuelPauseFlags();

    assert.equal(state.getObstacleDamage('wagon'), 2);
    assert.equal(state.getMatchEndsAt(), null);
    assert.equal(state.getHitMessage(), null);

    state.resetDuelFlags();

    assert.equal(state.getObstacleDamage('wagon'), 0);
});

test('records scenario start time', async function () {
    const ClientDuelState = await loadClientDuelState();
    const state = new ClientDuelState({
        getTime() {
            return 1234;
        }
    });

    assert.equal(state.getScenarioStartedAt(), null);
    state.startScenario();
    assert.equal(state.getScenarioStartedAt(), 1234);
});
