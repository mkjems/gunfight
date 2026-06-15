import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientRoundState() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/state/clientRoundState.ts'),
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

    return module.ClientRoundState;
}

test('tracks round clock and messages', async function () {
    const ClientRoundState = await loadClientRoundState();
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

test('tracks hit state', async function () {
    const ClientRoundState = await loadClientRoundState();
    const state = new ClientRoundState();
    const hitMessage = {
        targetId: 'player-2',
        text: 'Got me!'
    };

    state.setHitMessage(hitMessage);

    assert.equal(state.getHitMessage(), hitMessage);

    state.clearHitMessage();
    assert.equal(state.getHitMessage(), null);
});

test('resets obstacle damage only for full round resets', async function () {
    const ClientRoundState = await loadClientRoundState();
    const state = new ClientRoundState();

    state.damageObstacle('wagon');
    state.damageObstacle('wagon');
    state.setRoundEndsAt(2000);
    state.setHitMessage({ text: 'hit' });

    state.clearRoundPauseFlags();

    assert.equal(state.getObstacleDamage('wagon'), 2);
    assert.equal(state.getRoundEndsAt(), null);
    assert.equal(state.getHitMessage(), null);

    state.resetRoundFlags();

    assert.equal(state.getObstacleDamage('wagon'), 0);
});

test('records scenario start time', async function () {
    const ClientRoundState = await loadClientRoundState();
    const state = new ClientRoundState({
        getTime() {
            return 1234;
        }
    });

    assert.equal(state.getScenarioStartedAt(), null);
    state.startScenario();
    assert.equal(state.getScenarioStartedAt(), 1234);
});
