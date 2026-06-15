import express from 'express';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { createLobby } from './gameModules/lobby.js';
import { createHighScores } from './gameModules/highScores.js';
import {
    createKeyEventPayload,
    createPlayerPositionPayload,
    getNameFromPayload,
    normalizeObstacleDamagePayload,
    normalizeRoundResultPayload,
    shouldRejoinAfterLeave
} from '../shared/contracts.js';

const portNumber = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.join(__dirname, '..', 'client');
const rocksPath = path.join(__dirname, 'rocks.json');
const scenariosPath = path.join(__dirname, 'scenarios.json');
const lobby = createLobby();
const highScores = createHighScores();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameTimers = new Map();

app.use(
    express.static(clientRoot, {
        setHeaders: function (res, filePath) {
            if (path.basename(filePath) === 'sw.js') {
                res.setHeader(
                    'Cache-Control',
                    'no-cache, no-store, must-revalidate'
                );
            }
        }
    })
);

app.get('/api', function (req, res) {
    res.send('Hello World, Api here');
});

app.get('/api/rocks', function (req, res) {
    res.type('application/json').send(readFileSync(rocksPath, 'utf8'));
});

app.get('/api/scenarios', function (req, res) {
    res.type('application/json').send(readFileSync(scenariosPath, 'utf8'));
});

app.get('/', function (req, res) {
    res.sendFile(path.join(clientRoot, 'index.html'));
});

app.get('/rock-editor', function (req, res) {
    res.sendFile(path.join(clientRoot, 'rock-editor.html'));
});

app.get('/scenario-editor', function (req, res) {
    res.sendFile(path.join(clientRoot, 'scenario-editor.html'));
});

function getSocketGameContext(socket) {
    const game = lobby.getGameForSocket(socket.id);
    const client = lobby.getClientForSocket(socket.id);

    if (!game || !client) {
        return null;
    }

    return {
        client: client,
        game: game
    };
}

function emitGameModel(game, eventName) {
    scheduleGameTimers(game);
    io.to(game.room).emit(eventName || 'modelUpdate', lobby.getModel(game));
}

function clearGameTimers(gameId) {
    const timers = gameTimers.get(gameId);

    if (!timers) {
        return;
    }

    if (timers.phase) {
        clearTimeout(timers.phase);
    }

    gameTimers.delete(gameId);
}

function scheduleGameTimers(game) {
    const model = lobby.getModel(game);

    clearGameTimers(game.id);

    if (!model.phaseEndsAt) {
        return;
    }

    gameTimers.set(game.id, {
        phase: setTimeout(
            function () {
                advanceTimedGamePhase(game.id, model.version, model.phase);
            },
            Math.max(0, model.phaseEndsAt - Date.now())
        )
    });
}

function recordResult(result) {
    if (result) {
        io.emit('highScores', highScores.recordGame(result));
    }
}

function advanceTimedGamePhase(gameId, version, phase) {
    const game = lobby.getGame(gameId);
    const model = game && lobby.getModel(game);
    let result = null;

    if (!game || !model || model.version !== version || model.phase !== phase) {
        return;
    }

    if (phase === 'readyCountdown') {
        lobby.startMatch(game);
    } else if (phase === 'roundIntro') {
        result = lobby.enterPlaying(game);
    } else if (phase === 'playing') {
        result = lobby.finishMatch(game);
    } else if (phase === 'hitPause') {
        result = lobby.finishHitPause(game);
    } else if (phase === 'gameOver') {
        lobby.returnToLobbyAfterGameOver(game);
    }

    recordResult(result);
    emitGameModel(game);
}

function joinSocketGame(socket, options) {
    const existingGame = lobby.getGameForSocket(socket.id);
    const joined = lobby.join(socket.id, options);
    const joinedModel = lobby.getModel(joined.game);

    socket.join(joined.game.room);
    socket.emit('joinedGame', {
        gameId: joined.game.id,
        name: joined.client.name,
        playerId: joined.client.id,
        slot: joinedModel.clients.findIndex(function (client) {
            return client.id === joined.client.id;
        }),
        model: joinedModel
    });

    if (existingGame) {
        emitGameModel(joined.game);
    } else {
        socket.to(joined.game.room).emit('newClient', joinedModel);
    }

    return joined;
}

function leaveSocketGame(socket) {
    const context = getSocketGameContext(socket);
    const left = lobby.leave(socket.id);

    if (context) {
        socket.leave(context.game.room);
    }

    if (left && left.model) {
        emitGameModel(left.game);
    } else if (left) {
        clearGameTimers(left.game.id);
    }

    return left;
}

function autoPairWaitingPlayer(game) {
    const targetGame = game && lobby.findAutoPairTarget(game.id);
    const waitingClient = game && game.clients.length === 1 && game.clients[0];
    const waitingSocket =
        waitingClient && io.sockets.sockets.get(waitingClient.socketId);
    const name = waitingClient && waitingClient.name;

    if (
        !game ||
        lobby.getStatus(game) !== 'waiting' ||
        !targetGame ||
        !waitingClient ||
        !waitingSocket
    ) {
        return null;
    }

    leaveSocketGame(waitingSocket);
    return joinSocketGame(waitingSocket, {
        name: name
    });
}

function autoPairAfterLeave(left) {
    if (!left || !left.model) {
        return null;
    }

    return autoPairWaitingPlayer(left.game);
}

function getNameFromSocketHandshake(socket) {
    return (
        getNameFromPayload(socket.handshake.auth) ||
        getNameFromPayload(socket.handshake.query)
    );
}

io.on('connection', function (socket) {
    const joined = joinSocketGame(socket, {
        name: getNameFromSocketHandshake(socket)
    });
    const client = joined.client;

    socket.emit('highScores', highScores.getTable());

    socket.on('disconnect', function (reason) {
        autoPairAfterLeave(leaveSocketGame(socket));

        console.log('client disconnected', client.id, reason);
    });

    socket.on(
        'joinLobby',
        /** @param {unknown} data */
        function (data) {
            joinSocketGame(socket, {
                name: getNameFromPayload(data)
            });
        }
    );

    socket.on(
        'updateName',
        /** @param {unknown} data */
        function (data) {
            const updated = lobby.updateName(
                socket.id,
                getNameFromPayload(data)
            );

            if (!updated) {
                return;
            }

            emitGameModel(updated.game);
        }
    );

    socket.on(
        'leaveGame',
        /** @param {unknown} data */
        function (data) {
            const left = leaveSocketGame(socket);

            autoPairAfterLeave(left);

            socket.emit('leftGame', {
                gameId: left && left.game.id
            });

            if (shouldRejoinAfterLeave(data)) {
                joinSocketGame(socket, {
                    name: left && left.client.name
                });
            }
        }
    );

    socket.on('requeue', function () {
        const context = getSocketGameContext(socket);
        const name = context && context.client.name;

        leaveSocketGame(socket);
        joinSocketGame(socket, {
            name: name
        });
    });

    socket.on(
        'clientKeyEvent',
        /** @param {unknown} data */
        function (data) {
            const context = getSocketGameContext(socket);
            let keyEvent;

            if (!context) {
                return;
            }

            keyEvent = createKeyEventPayload(data, context.client.id);

            if (!keyEvent) {
                return;
            }

            socket.to(context.game.room).emit('keyEvent', keyEvent);
        }
    );

    socket.on(
        'playerPosition',
        /** @param {unknown} data */
        function (data) {
            const context = getSocketGameContext(socket);
            let position;

            if (!context) {
                return;
            }

            position = createPlayerPositionPayload(data, context.client.id);

            if (!position) {
                return;
            }

            socket.to(context.game.room).emit('playerPosition', position);
        }
    );

    socket.on(
        'obstacleDamage',
        /** @param {unknown} data */
        function (data) {
            const context = getSocketGameContext(socket);
            const payload = normalizeObstacleDamagePayload(data);

            if (!context || !payload || payload.ownerId !== context.client.id) {
                return;
            }

            socket.to(context.game.room).emit('obstacleDamage', payload);
        }
    );

    socket.on('clientReady', function () {
        const context = getSocketGameContext(socket);

        if (!context) {
            return;
        }

        if (!lobby.readyClient(context.game, context.client)) {
            emitGameModel(context.game);
            return;
        }

        emitGameModel(context.game);
    });

    socket.on('resetReady', function () {
        const context = getSocketGameContext(socket);

        if (!context) {
            return;
        }

        if (lobby.resetReady(context.game)) {
            emitGameModel(context.game);
        }
    });

    socket.on(
        'roundResult',
        /** @param {unknown} data */
        function (data) {
            const context = getSocketGameContext(socket);
            const result = normalizeRoundResultPayload(data);

            if (!context || !result || result.winnerId !== context.client.id) {
                return;
            }

            if (!lobby.recordRoundResult(context.game, result)) {
                return;
            }

            emitGameModel(context.game);
        }
    );

    socket.on('matchExpired', function () {
        const context = getSocketGameContext(socket);
        let result;

        if (!context) {
            return;
        }

        result = lobby.finishMatch(context.game);
        recordResult(result);
        emitGameModel(context.game);
    });
});

server.listen(portNumber, function () {
    console.log(
        'Gunfight server running on port: ' +
            portNumber +
            ', http://localhost:' +
            portNumber
    );
    console.log('Socket.io server running...');
});
