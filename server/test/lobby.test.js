import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_MODEL_TIMINGS } from '../gameModules/gfmodel.js';
import { createLobby } from '../gameModules/lobby.js';

function createTestLobby() {
    let timestamp = 1000;

    return createLobby({
        now: function () {
            timestamp++;
            return timestamp;
        }
    });
}

function createManualLobby() {
    let timestamp = 1000;

    return {
        lobby: createLobby({
            now: function () {
                return timestamp;
            }
        }),
        setTime(nextTimestamp) {
            timestamp = nextTimestamp;
        }
    };
}

function startPlayingGame(lobby, first, second) {
    assert.equal(lobby.readyClient(first.game, first.client), true);
    assert.equal(lobby.readyClient(first.game, second.client), true);
    assert.equal(lobby.getModel(first.game).phase, 'readyCountdown');
    assert.equal(lobby.startMatch(first.game), true);
    assert.equal(lobby.getModel(first.game).phase, 'roundIntro');
    assert.equal(lobby.enterPlaying(first.game), null);
    assert.equal(lobby.getModel(first.game).phase, 'playing');
}

function advanceAfterHit(lobby, game) {
    assert.equal(lobby.finishHitPause(game), null);
    assert.equal(lobby.getModel(game).phase, 'roundIntro');
}

function cloneModel(model) {
    return JSON.parse(JSON.stringify(model));
}

function assertVersionIncreased(lobby, game, action) {
    const previousVersion = lobby.getModel(game).version;
    const result = action();

    assert.equal(lobby.getModel(game).version > previousVersion, true);

    return result;
}

function assertModelUnchanged(lobby, game, action) {
    const previousModel = cloneModel(lobby.getModel(game));
    const result = action();

    assert.deepEqual(cloneModel(lobby.getModel(game)), previousModel);

    return result;
}

test('pairs the first two clients into the same game', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'red' });
    const second = lobby.join('socket-2', { name: 'blue' });
    const model = lobby.getModel(first.game);

    assert.equal(first.game.id, second.game.id);
    assert.equal(first.game.room, 'game:G0001');
    assert.equal(model.gameId, 'G0001');
    assert.equal(model.status, 'readying');
    assert.equal(model.playerLimit, 2);
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.name;
        }),
        ['RED', 'BLUE']
    );
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.slot;
        }),
        [0, 1]
    );
});

test('puts a third client into a different waiting game', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });
    const third = lobby.join('socket-3', { name: 'three' });

    assert.equal(first.game.id, second.game.id);
    assert.notEqual(third.game.id, first.game.id);
    assert.notEqual(third.game.room, first.game.room);
    assert.equal(third.game.id, 'G0002');
    assert.equal(lobby.getModel(first.game).clients.length, 2);
    assert.equal(lobby.getModel(third.game).clients.length, 1);
    assert.equal(lobby.getModel(third.game).status, 'waiting');
});

test('reports lobby states and ready flags for each player slot', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    let model = lobby.getModel(first.game);

    assert.equal(model.status, 'waiting');
    assert.equal(model.message, 'LOOKING FOR CHALLENGER');
    assert.deepEqual(
        model.clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready,
                slot: client.slot
            };
        }),
        [{ name: 'ONE', ready: false, slot: 0 }]
    );

    const second = lobby.join('socket-2', { name: 'two' });
    model = lobby.getModel(first.game);

    assert.equal(second.game.id, first.game.id);
    assert.equal(model.status, 'readying');
    assert.equal(model.message, 'PRESS P TO PLAY');
    assert.deepEqual(
        model.clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready,
                slot: client.slot
            };
        }),
        [
            { name: 'ONE', ready: false, slot: 0 },
            { name: 'TWO', ready: false, slot: 1 }
        ]
    );

    lobby.readyClient(first.game, first.client);
    model = lobby.getModel(first.game);

    assert.equal(model.status, 'readying');
    assert.equal(model.message, 'PRESS P TO PLAY');
    assert.deepEqual(
        model.clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready,
                slot: client.slot
            };
        }),
        [
            { name: 'ONE', ready: true, slot: 0 },
            { name: 'TWO', ready: false, slot: 1 }
        ]
    );

    lobby.readyClient(first.game, second.client);
    model = lobby.getModel(first.game);

    assert.equal(model.status, 'readying');
    assert.equal(model.phase, 'readyCountdown');
    assert.equal(typeof model.version, 'number');
    assert.equal(typeof model.phaseStartedAt, 'number');
    assert.equal(typeof model.phaseEndsAt, 'number');
    assert.equal(model.message, '');
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.ready;
        }),
        [true, true]
    );
});

test('does not allow a client to become ready before an opponent joins', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });

    assert.equal(lobby.readyClient(first.game, first.client), false);

    const model = lobby.getModel(first.game);

    assert.equal(model.status, 'waiting');
    assert.equal(model.message, 'LOOKING FOR CHALLENGER');
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.ready;
        }),
        [false]
    );
});

test('records round results on the server and rejects stale duplicates', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    startPlayingGame(lobby, first, second);

    assert.deepEqual(lobby.getModel(first.game).scores, [0, 0]);
    assert.equal(lobby.getModel(first.game).matchState, 'playing');
    assert.equal(lobby.getModel(first.game).phase, 'playing');
    assert.equal(typeof lobby.getModel(first.game).matchEndsAt, 'number');
    assert.equal(lobby.getModel(first.game).roundNumber, 1);

    assert.equal(
        lobby.recordRoundResult(first.game, {
            roundNumber: 1,
            targetId: second.client.id,
            winnerId: first.client.id
        }),
        true
    );

    assert.deepEqual(lobby.getModel(first.game).scores, [1, 0]);
    assert.equal(lobby.getModel(first.game).phase, 'hitPause');
    assert.equal(lobby.getModel(first.game).roundNumber, 1);

    assert.equal(
        lobby.recordRoundResult(first.game, {
            roundNumber: 1,
            targetId: second.client.id,
            winnerId: first.client.id
        }),
        false
    );
    assert.deepEqual(lobby.getModel(first.game).scores, [1, 0]);
    advanceAfterHit(lobby, first.game);
    assert.equal(lobby.getModel(first.game).roundNumber, 2);
});

test('finishes matches from server-owned scores for high scores', function () {
    const manual = createManualLobby();
    const lobby = manual.lobby;
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    startPlayingGame(lobby, first, second);
    lobby.recordRoundResult(first.game, {
        roundNumber: 1,
        targetId: second.client.id,
        winnerId: first.client.id
    });
    advanceAfterHit(lobby, first.game);
    manual.setTime(lobby.getModel(first.game).matchEndsAt);

    const result = lobby.finishMatch(first.game);
    const model = lobby.getModel(first.game);

    assert.deepEqual(result, {
        resultId: 'G0001:2',
        gameId: 'G0001',
        roundNumber: 2,
        clients: [
            { name: 'ONE', slot: 0 },
            { name: 'TWO', slot: 1 }
        ],
        scores: [1, 0]
    });
    assert.equal(model.matchState, 'gameOver');
    assert.equal(model.matchResultId, 'G0001:2');
    assert.equal(
        model.phaseEndsAt,
        model.phaseStartedAt + GAME_MODEL_TIMINGS.gameOverMs
    );
    assert.equal(lobby.finishMatch(first.game), null);

    manual.setTime(model.phaseEndsAt);

    assert.equal(lobby.returnToLobbyAfterGameOver(first.game), true);

    assert.equal(lobby.getModel(first.game).matchState, 'idle');
    assert.deepEqual(lobby.getModel(first.game).scores, [0, 0]);
});

test('waits for the server-owned game-over phase before returning to lobby', function () {
    const manual = createManualLobby();
    const lobby = manual.lobby;
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    startPlayingGame(lobby, first, second);
    manual.setTime(lobby.getModel(first.game).matchEndsAt);
    assert.notEqual(lobby.finishMatch(first.game), null);

    const gameOverModel = lobby.getModel(first.game);

    manual.setTime(gameOverModel.phaseEndsAt - 1);

    assert.equal(lobby.resetReady(first.game), false);
    assert.equal(lobby.returnToLobbyAfterGameOver(first.game), false);
    assert.equal(lobby.getModel(first.game).phase, 'gameOver');
    assert.equal(lobby.getModel(first.game).version, gameOverModel.version);

    manual.setTime(gameOverModel.phaseEndsAt);

    assert.equal(lobby.resetReady(first.game), true);

    const returnedModel = lobby.getModel(first.game);

    assert.equal(returnedModel.phase, 'readying');
    assert.equal(returnedModel.status, 'readying');
    assert.equal(returnedModel.matchState, 'idle');
    assert.equal(returnedModel.matchEndsAt, undefined);
    assert.equal(returnedModel.phaseEndsAt, undefined);
    assert.deepEqual(returnedModel.scores, [0, 0]);
    assert.deepEqual(
        returnedModel.clients.map(function (client) {
            return client.ready;
        }),
        [false, false]
    );
    assert.equal(returnedModel.version, gameOverModel.version + 1);
});

test('keeps game rooms and models isolated', function () {
    const lobby = createTestLobby();
    const firstA = lobby.join('a-1', { name: 'ace' });
    const secondA = lobby.join('a-2', { name: 'doc' });
    const firstB = lobby.join('b-1', { name: 'kid' });
    const secondB = lobby.join('b-2', { name: 'rex' });

    startPlayingGame(lobby, firstA, secondA);
    lobby.recordRoundResult(firstA.game, {
        roundNumber: 1,
        targetId: secondA.client.id,
        winnerId: firstA.client.id
    });
    advanceAfterHit(lobby, firstA.game);
    lobby.updateName('a-1', 'jet');

    assert.notEqual(firstA.game.room, firstB.game.room);
    assert.equal(lobby.getGameForSocket('a-1').id, firstA.game.id);
    assert.equal(lobby.getGameForSocket('b-1').id, firstB.game.id);
    assert.equal(lobby.getModel(firstA.game).status, 'playing');
    assert.equal(lobby.getModel(firstB.game).status, 'readying');
    assert.equal(lobby.getModel(firstA.game).roundNumber, 2);
    assert.equal(lobby.getModel(firstB.game).roundNumber, 0);
    assert.deepEqual(
        lobby.getModel(firstA.game).clients.map(function (client) {
            return client.name;
        }),
        ['JET', 'DOC']
    );
    assert.deepEqual(
        lobby.getModel(firstB.game).clients.map(function (client) {
            return client.name;
        }),
        ['KID', 'REX']
    );
});

test('increments the public model version when a player changes name', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    lobby.join('socket-2', { name: 'two' });
    const previousVersion = lobby.getModel(first.game).version;

    const updated = lobby.updateName('socket-1', 'ace');

    assert.equal(updated.model.version, previousVersion + 1);
    assert.deepEqual(
        updated.model.clients.map(function (client) {
            return client.name;
        }),
        ['ACE', 'TWO']
    );
});

test('versions accepted slow-state changes that affect the public model', function () {
    const manual = createManualLobby();
    const lobby = manual.lobby;
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    assert.notEqual(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.updateName('socket-1', 'ace');
        }),
        null
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.readyClient(first.game, first.client);
        }),
        true
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.readyClient(first.game, second.client);
        }),
        true
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.startMatch(first.game);
        }),
        true
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.enterPlaying(first.game);
        }),
        null
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.recordRoundResult(first.game, {
                roundNumber: 1,
                targetId: second.client.id,
                winnerId: first.client.id
            });
        }),
        true
    );
    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.finishHitPause(first.game);
        }),
        null
    );

    manual.setTime(lobby.getModel(first.game).matchEndsAt);

    assert.notEqual(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.finishMatch(first.game);
        }),
        null
    );

    manual.setTime(lobby.getModel(first.game).phaseEndsAt);

    assert.equal(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.returnToLobbyAfterGameOver(first.game);
        }),
        true
    );
    assert.notEqual(
        assertVersionIncreased(lobby, first.game, function () {
            return lobby.leave('socket-2');
        }),
        null
    );
});

test('leaves rejected slow-state intents as public model no-ops', function () {
    const manual = createManualLobby();
    const lobby = manual.lobby;
    const first = lobby.join('socket-1', { name: 'one' });

    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.readyClient(first.game, first.client);
        }),
        false
    );
    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.updateName('socket-1', 'one');
        }),
        null
    );

    const second = lobby.join('socket-2', { name: 'two' });

    assert.equal(lobby.readyClient(first.game, first.client), true);
    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.readyClient(first.game, first.client);
        }),
        false
    );
    assert.equal(lobby.readyClient(first.game, second.client), true);
    assert.equal(lobby.startMatch(first.game), true);
    assert.equal(lobby.enterPlaying(first.game), null);
    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.finishMatch(first.game);
        }),
        null
    );
    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.recordRoundResult(first.game, {
                roundNumber: 2,
                targetId: second.client.id,
                winnerId: first.client.id
            });
        }),
        false
    );
    assert.equal(
        lobby.recordRoundResult(first.game, {
            roundNumber: 1,
            targetId: second.client.id,
            winnerId: first.client.id
        }),
        true
    );
    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.recordRoundResult(first.game, {
                roundNumber: 1,
                targetId: second.client.id,
                winnerId: first.client.id
            });
        }),
        false
    );

    manual.setTime(lobby.getModel(first.game).matchEndsAt);

    assert.notEqual(lobby.finishMatch(first.game), null);

    manual.setTime(lobby.getModel(first.game).phaseEndsAt - 1);

    assert.equal(
        assertModelUnchanged(lobby, first.game, function () {
            return lobby.resetReady(first.game);
        }),
        false
    );
});

test('disconnect before ready frees the waiting slot for another client', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });
    const left = lobby.leave('socket-1');
    const replacement = lobby.join('socket-3', { name: 'three' });
    const model = lobby.getModel(second.game);

    assert.equal(left.game.id, first.game.id);
    assert.equal(left.model.status, 'waiting');
    assert.equal(lobby.getClientForSocket('socket-1'), null);
    assert.equal(replacement.game.id, second.game.id);
    assert.equal(model.status, 'readying');
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.name;
        }),
        ['TWO', 'THREE']
    );
    assert.deepEqual(
        model.clients.map(function (client) {
            return client.slot;
        }),
        [0, 1]
    );
});

test('disconnect before play clears the remaining client ready state', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    lobby.readyClient(first.game, first.client);

    const left = lobby.leave('socket-2');

    assert.equal(left.model.status, 'waiting');
    assert.deepEqual(
        lobby.getModel(first.game).clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready
            };
        }),
        [{ name: 'ONE', ready: false }]
    );
});

test('finds another alone waiting game for automatic pairing', function () {
    const lobby = createTestLobby();
    const firstA = lobby.join('a-1', { name: 'ace' });
    const secondA = lobby.join('a-2', { name: 'doc' });
    const firstB = lobby.join('b-1', { name: 'kid' });
    const secondB = lobby.join('b-2', { name: 'rex' });

    lobby.readyClient(firstA.game, firstA.client);
    lobby.readyClient(firstB.game, firstB.client);
    lobby.leave(secondA.client.socketId);

    assert.equal(lobby.findAutoPairTarget(firstA.game.id), null);

    lobby.leave(secondB.client.socketId);

    const target = lobby.findAutoPairTarget(firstB.game.id);

    assert.equal(target.id, firstA.game.id);
    assert.deepEqual(
        lobby.getModel(firstA.game).clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready
            };
        }),
        [{ name: 'ACE', ready: false }]
    );
    assert.deepEqual(
        lobby.getModel(firstB.game).clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready
            };
        }),
        [{ name: 'KID', ready: false }]
    );
});

test('disconnect during play abandons the game and avoids pairing new clients into it', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    startPlayingGame(lobby, first, second);

    const left = lobby.leave('socket-1');
    const third = lobby.join('socket-3', { name: 'three' });

    assert.equal(left.game.id, second.game.id);
    assert.equal(left.model.status, 'abandoned');
    assert.equal(left.model.message, 'OPPONENT LEFT');
    assert.deepEqual(
        left.model.clients.map(function (client) {
            return client.ready;
        }),
        [false]
    );
    assert.equal(lobby.getModel(second.game).clients.length, 1);
    assert.notEqual(third.game.id, second.game.id);
    assert.equal(third.game.id, 'G0002');
    assert.equal(lobby.getModel(third.game).status, 'waiting');
});

test('requeue moves the remaining abandoned player into a fresh waiting game', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    startPlayingGame(lobby, first, second);
    lobby.leave('socket-1');

    const abandonedModel = lobby.getModel(second.game);
    const requeued = lobby.requeue('socket-2');
    const requeuedModel = lobby.getModel(requeued.game);

    assert.equal(abandonedModel.status, 'abandoned');
    assert.equal(abandonedModel.message, 'OPPONENT LEFT');
    assert.notEqual(requeued.game.id, second.game.id);
    assert.equal(requeuedModel.status, 'waiting');
    assert.equal(requeuedModel.message, 'LOOKING FOR CHALLENGER');
    assert.deepEqual(
        requeuedModel.clients.map(function (client) {
            return {
                name: client.name,
                ready: client.ready,
                slot: client.slot
            };
        }),
        [{ name: 'TWO', ready: false, slot: 0 }]
    );
    assert.equal(lobby.getGame(second.game.id), null);
});

test('removes empty games', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    assert.equal(lobby.getGames().length, 1);

    const firstLeft = lobby.leave('socket-1');
    const secondLeft = lobby.leave('socket-2');

    assert.equal(firstLeft.model.status, 'waiting');
    assert.equal(secondLeft.model, null);
    assert.equal(lobby.getGame(first.game.id), null);
    assert.equal(lobby.getGames().length, 0);
    assert.equal(lobby.getGameForSocket('socket-1'), null);
    assert.equal(lobby.getGameForSocket('socket-2'), null);
    assert.equal(first.game.id, second.game.id);
});

test('sanitizes and deduplicates names inside a game', function () {
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'ace!' });
    lobby.join('socket-2', { name: 'ace' });

    assert.deepEqual(
        lobby.getModel(first.game).clients.map(function (client) {
            return client.name;
        }),
        ['ACE', 'ACE2']
    );
});
