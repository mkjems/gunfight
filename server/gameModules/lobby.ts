import { createGameModel } from './gfmodel.js';
import { GAME_PHASE, MATCH_STATE } from '../../shared/contracts.js';
import type {
    GameModelClient,
    GameResultPayload,
    PublicClient,
    PublicGameModel,
    DuelResultPayload
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

const LOBBY_STATUS = {
    Waiting: 'waiting',
    Readying: 'readying',
    Playing: 'playing',
    Abandoned: 'abandoned',
    Closed: 'closed'
} as const;

type GameStatus = (typeof LOBBY_STATUS)[keyof typeof LOBBY_STATUS];

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

    if (status === LOBBY_STATUS.Abandoned) {
        return 'OPPONENT LEFT';
    }

    if (status === LOBBY_STATUS.Playing) {
        return '';
    }

    if (game.clients.length < MAX_PLAYERS_PER_GAME) {
        return 'LOOKING FOR CHALLENGER';
    }

    if (model.phase === GAME_PHASE.ReadyCountdown) {
        return '';
    }

    return 'PRESS P TO PLAY';
}

function getGameStatus(game: GameSession): GameStatus {
    const phase = game.model.getModel().phase;

    if (phase === GAME_PHASE.Closed) {
        return LOBBY_STATUS.Closed;
    }

    if (phase === GAME_PHASE.Abandoned) {
        return LOBBY_STATUS.Abandoned;
    }

    if (
        phase === GAME_PHASE.DuelIntro ||
        phase === GAME_PHASE.Playing ||
        phase === GAME_PHASE.HitPause ||
        phase === GAME_PHASE.GameOver
    ) {
        return LOBBY_STATUS.Playing;
    }

    if (phase === GAME_PHASE.Readying || phase === GAME_PHASE.ReadyCountdown) {
        return LOBBY_STATUS.Readying;
    }

    return LOBBY_STATUS.Waiting;
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
                getGameStatus(game) === LOBBY_STATUS.Waiting &&
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
                getGameStatus(game) === LOBBY_STATUS.Waiting &&
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

        const resolvedName = resolveUniqueName(name, {
            clients: game.clients.filter(function (item) {
                return item.socketId !== socketId;
            })
        });

        if (client.name === resolvedName) {
            return null;
        }

        client.name = resolvedName;
        game.model.touch();
        game.updatedAt = now();

        return {
            client: client,
            game: game,
            model: getModel(game)
        };
    }

    function recordDuelResult(
        game: GameSession,
        result: DuelResultPayload
    ): boolean {
        const accepted = game.model.recordDuelResult(result);

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
        return game.id + ':' + game.model.getModel().duelNumber;
    }

    function enterPlaying(game: GameSession): GameResultPayload | null {
        const resultId = createResultId(game);
        const accepted = game.model.enterPlaying(resultId);

        if (!accepted) {
            return null;
        }

        game.updatedAt = now();

        if (game.model.getModel().matchState === MATCH_STATE.GameOver) {
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

        if (game.model.getModel().matchState === MATCH_STATE.GameOver) {
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
            duelNumber: model.duelNumber,
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
            message: getGameMessage(game),
            playerLimit: MAX_PLAYERS_PER_GAME,
            clients: game.clients.map(toPublicClient)
        };
    }

    function getGames(): GameSession[] {
        return Array.from(games.values());
    }

    function isWaiting(game: GameSession): boolean {
        return getGameStatus(game) === LOBBY_STATUS.Waiting;
    }

    return {
        findAutoPairTarget: findAutoPairTarget,
        getClientForSocket: getClientForSocket,
        getGame: getGame,
        getGameForSocket: getGameForSocket,
        getGames: getGames,
        getModel: getModel,
        getStatus: getGameStatus,
        isWaiting: isWaiting,
        join: join,
        leave: leave,
        enterPlaying: enterPlaying,
        finishMatch: finishMatch,
        finishHitPause: finishHitPause,
        readyClient: readyClient,
        recordDuelResult: recordDuelResult,
        requeue: requeue,
        returnToLobbyAfterGameOver: returnToLobbyAfterGameOver,
        startMatch: startMatch,
        updateName: updateName
    };
}
