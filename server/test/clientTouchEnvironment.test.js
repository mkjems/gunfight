import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadClientTouchEnvironment() {
    const context = {
        GF: {}
    };
    const source = readFileSync(
        new URL('../../client/js/ClientTouchEnvironment.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.ClientTouchEnvironment;
}

test('detects touch override from query string', function () {
    const environment = loadClientTouchEnvironment();

    assert.equal(
        environment.isTouchInterface({
            location: {
                search: '?touch=1'
            }
        }),
        true
    );
});

test('detects coarse pointer touch interface', function () {
    const environment = loadClientTouchEnvironment();

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

test('rejects non-touch pointer interfaces', function () {
    const environment = loadClientTouchEnvironment();

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
