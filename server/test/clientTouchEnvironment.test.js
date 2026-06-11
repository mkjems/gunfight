import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

async function loadClientTouchEnvironment() {
    const source = readFileSync(
        path.join(
            process.cwd(),
            'client/src/modules/clientTouchEnvironment.ts'
        ),
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

    return module.ClientTouchEnvironment;
}

test('detects touch override from query string', async function () {
    const environment = await loadClientTouchEnvironment();

    assert.equal(
        environment.isTouchInterface({
            location: {
                search: '?touch=1'
            }
        }),
        true
    );
});

test('detects coarse pointer touch interface', async function () {
    const environment = await loadClientTouchEnvironment();

    assert.equal(
        environment.isTouchInterface({
            location: {
                search: ''
            },
            matchMedia(query) {
                assert.equal(query, '(pointer: coarse)');

                return {
                    matches: true
                };
            }
        }),
        true
    );
});

test('rejects non-touch pointer interfaces', async function () {
    const environment = await loadClientTouchEnvironment();

    assert.equal(
        environment.isTouchInterface({
            location: {
                search: ''
            },
            matchMedia() {
                return {
                    matches: false
                };
            }
        }),
        false
    );
});
