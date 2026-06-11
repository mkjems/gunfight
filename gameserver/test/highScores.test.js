import assert from 'node:assert/strict';
import test from 'node:test';
import { createHighScores } from '../gameModules/highScores.js';

test('records wins kills and deaths by player name', function () {
    const highScores = createHighScores();

    highScores.recordGame({
        resultId: 'G0001:1',
        clients: [
            { name: 'kid', slot: 0 },
            { name: 'doc', slot: 1 }
        ],
        scores: [3, 1]
    });

    assert.deepEqual(highScores.getTable(), [
        { name: 'KID', wins: 1, kills: 3, deaths: 1 },
        { name: 'DOC', wins: 0, kills: 1, deaths: 3 }
    ]);
});

test('ignores duplicate result submissions', function () {
    const highScores = createHighScores();
    const result = {
        resultId: 'G0001:1',
        clients: [
            { name: 'kid', slot: 0 },
            { name: 'doc', slot: 1 }
        ],
        scores: [2, 0]
    };

    highScores.recordGame(result);
    highScores.recordGame(result);

    assert.deepEqual(highScores.getTable(), [
        { name: 'KID', wins: 1, kills: 2, deaths: 0 },
        { name: 'DOC', wins: 0, kills: 0, deaths: 2 }
    ]);
});

test('does not award wins for a tie', function () {
    const highScores = createHighScores();

    highScores.recordGame({
        resultId: 'G0001:1',
        clients: [
            { name: 'kid', slot: 0 },
            { name: 'doc', slot: 1 }
        ],
        scores: [1, 1]
    });

    assert.deepEqual(highScores.getTable(), [
        { name: 'DOC', wins: 0, kills: 1, deaths: 1 },
        { name: 'KID', wins: 0, kills: 1, deaths: 1 }
    ]);
});
