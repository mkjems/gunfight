import { createGameModel } from './gfmodel.js';
import type {
    GameModelClient,
    GameResultPayload,
    GameStatus,
    PublicClient,
    PublicGameModel,
    RoundResultPayload
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
    const model = game.model.getModel();
    const status = getGameStatus(game);

    if (status === 'abandoned') {
        return 'OPPONENT LEFT';
    }

    if (status === 'playing') {
        return '';
    }

    if (game.clients.length < MAX_PLAYERS_PER_GAME) {
        return 'LOOKING FOR CHALLENGER';
    }

    if (model.phase === 'readyCountdown') {
        return '';
    }

    return 'PRESS P TO PLAY';
}

function getGameStatus(game: GameSession): GameStatus {
    const phase = game.model.getModel().phase;

    if (phase === 'closed') {
        return 'closed';
    }

    if (phase === 'abandoned') {
        return 'abandoned';
    }

    if (
        phase === 'roundIntro' ||
        phase === 'playing' ||
        phase === 'hitPause' ||
        phase === 'gameOver'
    ) {
        return 'playing';
    }

    if (phase === 'readying' || phase === 'readyCountdown') {
        return 'readying';
    }

    return 'waiting';
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
            model: createGameModel({ now }),
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
                getGameStatus(game) === 'waiting' &&
                game.clients.length < MAX_PLAYERS_PER_GAME
            ) {
                waitingGame = game;
            }
        });

        return waitingGame;
    }

    function findAutoPairTarget(sourceGameId: string): GameSession | null {
        let waitingGame: GameSession | null = null;

        games.forEach(function (game) {
            if (waitingGame) {
                return;
            }

            if (
                game.id !== sourceGameId &&
                getGameStatus(game) === 'waiting' &&
                game.clients.length === 1
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
            games.delete(game.id);
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
        game.model.touch();
        game.updatedAt = now();

        return {
            client: client,
            game: game,
            model: getModel(game)
        };
    }

    function recordRoundResult(
        game: GameSession,
        result: RoundResultPayload
    ): boolean {
        const accepted = game.model.recordRoundResult(result);

        if (accepted) {
            game.updatedAt = now();
        }

        return accepted;
    }

    function readyClient(game: GameSession, client: LobbyClient): boolean {
        const accepted = game.model.readyClient(client);

        if (accepted) {
            game.updatedAt = now();
        }

        return accepted;
    }

    function resetReady(game: GameSession): boolean {
        const accepted = game.model.resetReady();

        if (accepted) {
            game.updatedAt = now();
        }

        return accepted;
    }

    function returnToLobbyAfterGameOver(game: GameSession): boolean {
        const accepted = game.model.returnToLobbyAfterGameOver();

        if (accepted) {
            game.updatedAt = now();
        }

        return accepted;
    }

    function startMatch(game: GameSession): boolean {
        const accepted = game.model.startMatch();

        if (accepted) {
            game.updatedAt = now();
        }

        return accepted;
    }

    function createResultId(game: GameSession): string {
        return game.id + ':' + game.model.getModel().roundNumber;
    }

    function enterPlaying(game: GameSession): GameResultPayload | null {
        const resultId = createResultId(game);
        const accepted = game.model.enterPlaying(resultId);

        if (!accepted) {
            return null;
        }

        game.updatedAt = now();

        if (game.model.getModel().matchState === 'gameOver') {
            return createGameResult(game, resultId);
        }

        return null;
    }

    function finishHitPause(game: GameSession): GameResultPayload | null {
        const resultId = createResultId(game);
        const accepted = game.model.finishHitPause(resultId);

        if (!accepted) {
            return null;
        }

        game.updatedAt = now();

        if (game.model.getModel().matchState === 'gameOver') {
            return createGameResult(game, resultId);
        }

        return null;
    }

    function createGameResult(
        game: GameSession,
        resultId: string
    ): GameResultPayload {
        const model = getModel(game);

        return {
            resultId: resultId,
            gameId: game.id,
            roundNumber: model.roundNumber,
            clients: model.clients.map(function (client) {
                return {
                    name: client.name,
                    slot: client.slot
                };
            }),
            scores: model.scores.slice()
        };
    }

    function finishMatch(game: GameSession): GameResultPayload | null {
        const resultId = createResultId(game);

        if (!game.model.finishMatch(resultId)) {
            return null;
        }

        game.updatedAt = now();

        return createGameResult(game, resultId);
    }

    function getModel(game: GameSession): PublicGameModel {
        const model = game.model.getModel();

        return {
            ...model,
            gameId: game.id,
            status: getGameStatus(game),
            message: getGameMessage(game),
            playerLimit: MAX_PLAYERS_PER_GAME,
            clients: game.clients.map(toPublicClient)
        };
    }

    function getGames(): GameSession[] {
        return Array.from(games.values());
    }

    return {
        findAutoPairTarget: findAutoPairTarget,
        getClientForSocket: getClientForSocket,
        getGame: getGame,
        getGameForSocket: getGameForSocket,
        getGames: getGames,
        getModel: getModel,
        getStatus: getGameStatus,
        join: join,
        leave: leave,
        enterPlaying: enterPlaying,
        finishMatch: finishMatch,
        finishHitPause: finishHitPause,
        readyClient: readyClient,
        recordRoundResult: recordRoundResult,
        requeue: requeue,
        resetReady: resetReady,
        returnToLobbyAfterGameOver: returnToLobbyAfterGameOver,
        startMatch: startMatch,
        updateName: updateName
    };
}
