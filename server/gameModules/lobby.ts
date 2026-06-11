import { createGameModel } from './gfmodel.js';
import type {
    GameModelClient,
    GameStatus,
    PublicClient,
    PublicGameModel
} from '../../shared/contracts.js';

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

interface LobbyClient extends GameModelClient {
    gameId: string;
    socketId: string;
    name: string;
}

interface GameSession {
    id: string;
    room: string;
    status: GameStatus;
    model: ReturnType<typeof createGameModel>;
    clients: LobbyClient[];
    createdAt: number;
    updatedAt: number;
}

interface LobbyOptions {
    now?: () => number;
}

interface JoinOptions {
    name?: unknown;
}

interface LobbyJoinResult {
    client: LobbyClient;
    game: GameSession;
    model: PublicGameModel;
}

interface LobbyLeaveResult {
    client: LobbyClient;
    game: GameSession;
    model: PublicGameModel | null;
}

function defaultNow(): number {
    return Date.now();
}

function padGameId(id: number): string {
    return String(id).padStart(4, '0');
}

function createRoomName(gameId: string): string {
    return 'game:' + gameId;
}

function sanitizeName(name: unknown): string {
    return String(name || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
}

function createSafeName(name: unknown): string | null {
    return sanitizeName(name) || null;
}

function resolveUniqueName(
    name: unknown,
    game: { clients: LobbyClient[] }
): string {
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

function toPublicClient(client: LobbyClient, index: number): PublicClient {
    return {
        id: client.id,
        name: client.name,
        ready: client.ready,
        slot: index
    };
}

function getGameMessage(game: GameSession): string {
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

function updateGameStatus(game: GameSession): void {
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

function createLobbyClient(
    modelClient: GameModelClient,
    game: GameSession,
    socketId: string,
    name: unknown
): LobbyClient {
    return Object.assign(modelClient, {
        gameId: game.id,
        socketId: socketId,
        name: resolveUniqueName(name, game)
    });
}

export function createLobby(options: LobbyOptions = {}) {
    const now = options.now || defaultNow;
    const games = new Map<string, GameSession>();
    const clientsBySocketId = new Map<string, LobbyClient>();
    let nextGameId = 1;

    function createGame(): GameSession {
        const gameId = 'G' + padGameId(nextGameId);
        const game: GameSession = {
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

    function findWaitingGame(): GameSession | null {
        let waitingGame: GameSession | null = null;

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

    function getGameForSocket(socketId: string): GameSession | null {
        const client = clientsBySocketId.get(socketId);

        return client ? games.get(client.gameId) || null : null;
    }

    function getClientForSocket(socketId: string): LobbyClient | null {
        return clientsBySocketId.get(socketId) || null;
    }

    function getGame(gameId: string): GameSession | null {
        return games.get(gameId) || null;
    }

    function join(
        socketId: string,
        joinOptions: JoinOptions = {}
    ): LobbyJoinResult {
        const existingGame = getGameForSocket(socketId);
        const game = existingGame || findWaitingGame() || createGame();
        let client = clientsBySocketId.get(socketId);

        if (client) {
            return {
                client: client,
                game: game,
                model: getModel(game)
            };
        }

        client = createLobbyClient(
            game.model.getNewClient(),
            game,
            socketId,
            joinOptions.name
        );
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

    function leave(socketId: string): LobbyLeaveResult | null {
        const client = clientsBySocketId.get(socketId);
        const game = client ? games.get(client.gameId) || null : null;

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

    function requeue(socketId: string): LobbyJoinResult {
        const client = clientsBySocketId.get(socketId);
        const name = client && client.name;

        leave(socketId);
        return join(socketId, { name: name });
    }

    function updateName(
        socketId: string,
        name: unknown
    ): LobbyJoinResult | null {
        const client = clientsBySocketId.get(socketId);
        const game = client ? games.get(client.gameId) || null : null;

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

    function markPlaying(game: GameSession): void {
        game.status = 'playing';
        game.updatedAt = now();
    }

    function refreshStatus(game: GameSession): void {
        updateGameStatus(game);
        game.updatedAt = now();
    }

    function getModel(game: GameSession): PublicGameModel {
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

    function getGames(): GameSession[] {
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
