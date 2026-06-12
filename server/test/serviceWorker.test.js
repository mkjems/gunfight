import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('service worker clears old caches without serving cached app assets', function () {
    const source = readFileSync(
        path.join(process.cwd(), 'client/sw.js'),
        'utf8'
    );

    assert.match(source, /caches\.delete/);
    assert.match(source, /clients\.claim/);
    assert.doesNotMatch(source, /cache\.addAll/);
    assert.doesNotMatch(source, /caches\.match/);
    assert.doesNotMatch(source, /respondWith/);
});
