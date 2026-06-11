import express from 'express';
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
    normalizeGameResultPayload,
    normalizeObstacleDamagePayload,
    shouldRejoinAfterLeave
} from '../shared/contracts.js';

const portNumber = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.join(__dirname, '..', 'client');
const lobby = createLobby();
const highScores = createHighScores();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

app.get('/', function (req, res) {
    res.sendFile(path.join(clientRoot, 'index.html'));
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
    io.to(game.room).emit(eventName || 'modelUpdate', lobby.getModel(game));
}

function isReadyToStart(model) {
    return (
        model.clients.length >= 2 &&
        model.clients.every(function (client) {
            return client.ready;
        })
    );
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
    }

    return left;
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
        leaveSocketGame(socket);

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
        let model;

        if (!context) {
            return;
        }

        context.game.model.readyClient(context.client);
        model = lobby.getModel(context.game);

        if (isReadyToStart(model)) {
            lobby.markPlaying(context.game);
        }

        emitGameModel(context.game);
    });

    socket.on('resetReady', function () {
        const context = getSocketGameContext(socket);

        if (!context) {
            return;
        }

        context.game.model.resetReady();
        lobby.refreshStatus(context.game);
        emitGameModel(context.game);
    });

    socket.on('advanceRound', function () {
        const context = getSocketGameContext(socket);

        if (!context) {
            return;
        }

        context.game.model.advanceRound();
        emitGameModel(context.game);
    });

    socket.on(
        'recordGameResult',
        /** @param {unknown} data */
        function (data) {
            const result = normalizeGameResultPayload(data);

            if (!result) {
                return;
            }

            io.emit('highScores', highScores.recordGame(result));
        }
    );
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
