import { createGameModel } from './gfmodel.js';

const MAX_PLAYERS_PER_GAME = 2;
const DEFAULT_NAMES = [
    'ACE',
    'KID',
    'DOC',
    'RED',
    'JET',
    'MAX',
    'BUD',
    'CAL',
    'DUK',
    'IKE',
    'REX',
    'SAM'
];

/**
 * @typedef {'waiting' | 'readying' | 'playing' | 'abandoned' | 'closed'} GameStatus
 * @typedef {{ id: number, ready: boolean, gameId: string, socketId: string, name: string }} LobbyClient
 * @typedef {{ id: string, room: string, status: GameStatus, model: ReturnType<typeof createGameModel>, clients: LobbyClient[], createdAt: number, updatedAt: number }} GameSession
 * @typedef {{ id: number, name: string, ready: boolean, slot: number }} PublicClient
 * @typedef {{ gameId: string, status: GameStatus, message: string, playerLimit: number, clients: PublicClient[], currentScenario: object | null, roundNumber: number }} PublicGameModel
 */

function defaultNow() {
    return Date.now();
}

function padGameId(id) {
    return String(id).padStart(4, '0');
}

function createRoomName(gameId) {
    return 'game:' + gameId;
}

function sanitizeName(name) {
    return String(name || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
}

function createSafeName(name) {
    return sanitizeName(name) || null;
}

function resolveUniqueName(name, game) {
    const baseName =
        createSafeName(name) ||
        DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
    const usedNames = game.clients.map(function (client) {
        return client.name;
    });
    let resolvedName = baseName;
    let suffix = 2;

    while (usedNames.includes(resolvedName)) {
        resolvedName =
            baseName.slice(0, Math.max(1, 8 - String(suffix).length)) + suffix;
        suffix++;
    }

    return resolvedName;
}

function toPublicClient(client, index) {
    return {
        id: client.id,
        name: client.name,
        ready: client.ready,
        slot: index
    };
}

function getGameMessage(game) {
    if (game.status === 'abandoned') {
        return 'OPPONENT LEFT';
    }

    if (game.status === 'playing') {
        return '';
    }

    if (game.clients.length < MAX_PLAYERS_PER_GAME) {
        return 'LOOKING FOR CHALLENGER';
    }

    if (
        game.clients.every(function (client) {
            return client.ready;
        })
    ) {
        return '';
    }

    return 'PRESS P TO PLAY';
}

function updateGameStatus(game) {
    if (game.clients.length === 0) {
        game.status = 'closed';
        return;
    }

    if (game.status === 'abandoned') {
        return;
    }

    if (game.clients.length >= MAX_PLAYERS_PER_GAME) {
        game.status = 'readying';
        return;
    }

    game.status = 'waiting';
}

export function createLobby(options) {
    options = options || {};

    const now = options.now || defaultNow;
    const games = new Map();
    const clientsBySocketId = new Map();
    let nextGameId = 1;

    function createGame() {
        const gameId = 'G' + padGameId(nextGameId);
        const game = {
            id: gameId,
            room: createRoomName(gameId),
            status: 'waiting',
            model: createGameModel(),
            clients: [],
            createdAt: now(),
            updatedAt: now()
        };

        nextGameId++;
        games.set(game.id, game);
        return game;
    }

    function findWaitingGame() {
        let waitingGame = null;

        games.forEach(function (game) {
            if (waitingGame) {
                return;
            }

            if (
                game.status === 'waiting' &&
                game.clients.length < MAX_PLAYERS_PER_GAME
            ) {
                waitingGame = game;
            }
        });

        return waitingGame;
    }

    function getGameForSocket(socketId) {
        const client = clientsBySocketId.get(socketId);

        return client ? games.get(client.gameId) : null;
    }

    function getClientForSocket(socketId) {
        return clientsBySocketId.get(socketId) || null;
    }

    function getGame(gameId) {
        return games.get(gameId) || null;
    }

    function join(socketId, options) {
        options = options || {};

        const existingGame = getGameForSocket(socketId);
        let game = existingGame || findWaitingGame() || createGame();
        let client = clientsBySocketId.get(socketId);

        if (client) {
            return {
                client: client,
                game: game,
                model: getModel(game)
            };
        }

        client = game.model.getNewClient();
        client.gameId = game.id;
        client.socketId = socketId;
        client.name = resolveUniqueName(options.name, game);
        game.clients.push(client);
        game.updatedAt = now();
        clientsBySocketId.set(socketId, client);
        updateGameStatus(game);

        return {
            client: client,
            game: game,
            model: getModel(game)
        };
    }

    function leave(socketId) {
        const client = clientsBySocketId.get(socketId);
        const game = client ? games.get(client.gameId) : null;

        if (!client || !game) {
            return null;
        }

        game.model.disconnect(client);
        game.clients = game.clients.filter(function (item) {
            return item.socketId !== socketId;
        });
        clientsBySocketId.delete(socketId);
        game.updatedAt = now();

        if (game.clients.length === 0) {
            game.status = 'closed';
            games.delete(game.id);
        } else if (game.status === 'playing') {
            game.status = 'abandoned';
        } else {
            updateGameStatus(game);
        }

        return {
            client: client,
            game: game,
            model: games.has(game.id) ? getModel(game) : null
        };
    }

    function requeue(socketId) {
        const client = clientsBySocketId.get(socketId);
        const name = client && client.name;

        leave(socketId);
        return join(socketId, { name: name });
    }

    function updateName(socketId, name) {
        const client = clientsBySocketId.get(socketId);
        const game = client ? games.get(client.gameId) : null;

        if (!client || !game) {
            return null;
        }

        client.name = resolveUniqueName(name, {
            clients: game.clients.filter(function (item) {
                return item.socketId !== socketId;
            })
        });
        game.updatedAt = now();

        return {
            client: client,
            game: game,
            model: getModel(game)
        };
    }

    function markPlaying(game) {
        game.status = 'playing';
        game.updatedAt = now();
    }

    function refreshStatus(game) {
        updateGameStatus(game);
        game.updatedAt = now();
    }

    /** @returns {PublicGameModel} */
    function getModel(game) {
        const model = game.model.getModel();

        return {
            ...model,
            gameId: game.id,
            status: game.status,
            message: getGameMessage(game),
            playerLimit: MAX_PLAYERS_PER_GAME,
            clients: game.clients.map(toPublicClient)
        };
    }

    function getGames() {
        return Array.from(games.values());
    }

    return {
        getClientForSocket: getClientForSocket,
        getGame: getGame,
        getGameForSocket: getGameForSocket,
        getGames: getGames,
        getModel: getModel,
        join: join,
        leave: leave,
        markPlaying: markPlaying,
        refreshStatus: refreshStatus,
        requeue: requeue,
        updateName: updateName
    };
}
