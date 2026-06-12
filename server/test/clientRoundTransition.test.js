import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientRoundTransition() {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src/flows/clientRoundTransition.ts'),
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

    return module.ClientRoundTransition;
}

test('resolves legal round state transitions', async function () {
    const transition = await loadClientRoundTransition();

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

test('rejects illegal round state transitions', async function () {
    const transition = await loadClientRoundTransition();

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
            message: 'Illegal round state transition: gameOver -> playing'
        }
    );
});
