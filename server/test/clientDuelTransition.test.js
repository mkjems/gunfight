import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientDuelTransition() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/flows/clientDuelTransition.ts'),
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

    return module.ClientDuelTransition;
}

test('resolves legal duel state transitions', async function () {
    const transition = await loadClientDuelTransition();

    assert.equal(
        transition.resolve({
            canTransition(currentState, nextState) {
                assert.equal(currentState, 'waiting');
                assert.equal(nextState, 'playing');

                return true;
            },
            currentState: 'waiting',
            nextState: 'playing'
        }),
        'playing'
    );
});

test('rejects illegal duel state transitions', async function () {
    const transition = await loadClientDuelTransition();

    assert.throws(
        function () {
            transition.resolve({
                canTransition() {
                    return false;
                },
                currentState: 'gameOver',
                nextState: 'playing'
            });
        },
        {
            message: 'Illegal duel state transition: gameOver -> playing'
        }
    );
});
