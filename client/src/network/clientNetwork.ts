import type { SocketEvent } from '../../../shared/contracts.js';

const SOCKET_EVENT = {
    HighScores: 'highScores',
    JoinedGame: 'joinedGame',
    KeyEvent: 'keyEvent',
    PlayerPosition: 'playerPosition',
    ObstacleDamage: 'obstacleDamage',
    NewClient: 'newClient',
    ModelUpdate: 'modelUpdate'
} as const satisfies Record<string, SocketEvent>;

type Socket = {
    emit: (event: string, payload?: unknown) => void;
    on: (event: string, callback: (data: unknown) => void) => void;
};

type AuthPayload = {
    name?: string;
};

type AuthProvider = (callback: (payload: AuthPayload) => void) => void;

type IoFactory = (options: { auth: AuthProvider }) => Socket;

type ClientNetworkOptions = {
    getStoredPlayerName?: () => string;
    io?: IoFactory;
    onHighScores?: (data: unknown) => void;
    onJoinedGame?: (data: unknown) => void;
    onKeyEvent?: (data: unknown) => void;
    onModelUpdate?: (data: unknown) => void;
    onObstacleDamage?: (data: unknown) => void;
    onPlayerPosition?: (data: unknown) => void;
};

type GlobalWithIo = typeof globalThis & {
    io?: IoFactory;
};

export function ClientNetwork(options: ClientNetworkOptions = {}) {
    const ioFactory = options.io || (globalThis as GlobalWithIo).io;

    if (!ioFactory) {
        throw new Error('Socket.IO client is not available');
    }

    const socket = ioFactory({
        auth(callback) {
            callback(getAuthPayload(options.getStoredPlayerName));
        }
    });

    socket.on(SOCKET_EVENT.HighScores, function (nextHighScores) {
        if (options.onHighScores) {
            options.onHighScores(nextHighScores);
        }
    });

    socket.on(SOCKET_EVENT.JoinedGame, function (data) {
        if (options.onJoinedGame) {
            options.onJoinedGame(data);
        }
    });

    socket.on(SOCKET_EVENT.KeyEvent, function (keyEvent) {
        if (options.onKeyEvent) {
            options.onKeyEvent(keyEvent);
        }
    });

    socket.on(SOCKET_EVENT.PlayerPosition, function (data) {
        if (options.onPlayerPosition) {
            options.onPlayerPosition(data);
        }
    });

    socket.on(SOCKET_EVENT.ObstacleDamage, function (data) {
        if (options.onObstacleDamage) {
            options.onObstacleDamage(data);
        }
    });

    socket.on(SOCKET_EVENT.NewClient, function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    socket.on(SOCKET_EVENT.ModelUpdate, function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    return {
        socket
    };
}

function getAuthPayload(getStoredPlayerName?: () => string): AuthPayload {
    const storedPlayerName = getStoredPlayerName ? getStoredPlayerName() : '';

    return storedPlayerName
        ? {
              name: storedPlayerName
          }
        : {};
}
