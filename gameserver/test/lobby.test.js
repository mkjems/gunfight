import assert from 'node:assert/strict';
import test from 'node:test';
import { createLobby } from '../gameModules/lobby.js';

function createTestLobby(){
    let timestamp = 1000;

    return createLobby({
        now: function(){
            timestamp++;
            return timestamp;
        }
    });
}

test('pairs the first two clients into the same game', function(){
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'red' });
    const second = lobby.join('socket-2', { name: 'blue' });
    const model = lobby.getModel(first.game);

    assert.equal(first.game.id, second.game.id);
    assert.equal(first.game.room, 'game:G0001');
    assert.equal(model.gameId, 'G0001');
    assert.equal(model.status, 'readying');
    assert.equal(model.playerLimit, 2);
    assert.deepEqual(model.clients.map(function(client){
        return client.name;
    }), ['RED', 'BLUE']);
    assert.deepEqual(model.clients.map(function(client){
        return client.slot;
    }), [0, 1]);
});

test('puts a third client into a different waiting game', function(){
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

test('reports lobby states and ready flags for each player slot', function(){
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    let model = lobby.getModel(first.game);

    assert.equal(model.status, 'waiting');
    assert.equal(model.message, 'LOOKING FOR CHALLENGER');
    assert.deepEqual(model.clients.map(function(client){
        return {
            name: client.name,
            ready: client.ready,
            slot: client.slot
        };
    }), [
        { name: 'ONE', ready: false, slot: 0 }
    ]);

    const second = lobby.join('socket-2', { name: 'two' });
    model = lobby.getModel(first.game);

    assert.equal(second.game.id, first.game.id);
    assert.equal(model.status, 'readying');
    assert.equal(model.message, 'PRESS P TO PLAY');
    assert.deepEqual(model.clients.map(function(client){
        return {
            name: client.name,
            ready: client.ready,
            slot: client.slot
        };
    }), [
        { name: 'ONE', ready: false, slot: 0 },
        { name: 'TWO', ready: false, slot: 1 }
    ]);

    first.game.model.readyClient(first.client);
    model = lobby.getModel(first.game);

    assert.equal(model.status, 'readying');
    assert.equal(model.message, 'PRESS P TO PLAY');
    assert.deepEqual(model.clients.map(function(client){
        return {
            name: client.name,
            ready: client.ready,
            slot: client.slot
        };
    }), [
        { name: 'ONE', ready: true, slot: 0 },
        { name: 'TWO', ready: false, slot: 1 }
    ]);

    first.game.model.readyClient(second.client);
    lobby.markPlaying(first.game);
    model = lobby.getModel(first.game);

    assert.equal(model.status, 'playing');
    assert.equal(model.message, '');
    assert.deepEqual(model.clients.map(function(client){
        return client.ready;
    }), [true, true]);
});

test('keeps game rooms and models isolated', function(){
    const lobby = createTestLobby();
    const firstA = lobby.join('a-1', { name: 'ace' });
    const secondA = lobby.join('a-2', { name: 'doc' });
    const firstB = lobby.join('b-1', { name: 'kid' });
    const secondB = lobby.join('b-2', { name: 'rex' });

    firstA.game.model.readyClient(firstA.client);
    firstA.game.model.readyClient(secondA.client);
    lobby.markPlaying(firstA.game);
    firstA.game.model.advanceRound();
    lobby.updateName('a-1', 'jet');

    assert.notEqual(firstA.game.room, firstB.game.room);
    assert.equal(lobby.getGameForSocket('a-1').id, firstA.game.id);
    assert.equal(lobby.getGameForSocket('b-1').id, firstB.game.id);
    assert.equal(lobby.getModel(firstA.game).status, 'playing');
    assert.equal(lobby.getModel(firstB.game).status, 'readying');
    assert.equal(lobby.getModel(firstA.game).roundNumber, 2);
    assert.equal(lobby.getModel(firstB.game).roundNumber, 0);
    assert.deepEqual(lobby.getModel(firstA.game).clients.map(function(client){
        return client.name;
    }), ['JET', 'DOC']);
    assert.deepEqual(lobby.getModel(firstB.game).clients.map(function(client){
        return client.name;
    }), ['KID', 'REX']);
});

test('disconnect before ready frees the waiting slot for another client', function(){
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
    assert.deepEqual(model.clients.map(function(client){
        return client.name;
    }), ['TWO', 'THREE']);
    assert.deepEqual(model.clients.map(function(client){
        return client.slot;
    }), [0, 1]);
});

test('disconnect during play abandons the game and avoids pairing new clients into it', function(){
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'one' });
    const second = lobby.join('socket-2', { name: 'two' });

    lobby.markPlaying(first.game);

    const left = lobby.leave('socket-1');
    const third = lobby.join('socket-3', { name: 'three' });

    assert.equal(left.game.id, second.game.id);
    assert.equal(left.model.status, 'abandoned');
    assert.equal(left.model.message, 'OPPONENT LEFT');
    assert.equal(lobby.getModel(second.game).clients.length, 1);
    assert.notEqual(third.game.id, second.game.id);
    assert.equal(third.game.id, 'G0002');
    assert.equal(lobby.getModel(third.game).status, 'waiting');
});

test('removes empty games', function(){
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

test('sanitizes and deduplicates names inside a game', function(){
    const lobby = createTestLobby();
    const first = lobby.join('socket-1', { name: 'ace!' });
    lobby.join('socket-2', { name: 'ace' });

    assert.deepEqual(lobby.getModel(first.game).clients.map(function(client){
        return client.name;
    }), ['ACE', 'ACE2']);
});
