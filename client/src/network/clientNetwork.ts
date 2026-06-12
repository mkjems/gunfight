type Socket = {
    emit: (event: string, payload?: unknown) => void;
    on: (event: string, callback: (data: unknown) => void) => void;
};

type IoFactory = (options: { auth: { name?: string } }) => Socket;

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
    const storedPlayerName = options.getStoredPlayerName
        ? options.getStoredPlayerName()
        : '';
    const ioFactory = options.io || (globalThis as GlobalWithIo).io;

    if (!ioFactory) {
        throw new Error('Socket.IO client is not available');
    }

    const socket = ioFactory({
        auth: storedPlayerName
            ? {
                  name: storedPlayerName
              }
            : {}
    });

    socket.on('highScores', function (nextHighScores) {
        if (options.onHighScores) {
            options.onHighScores(nextHighScores);
        }
    });

    socket.on('joinedGame', function (data) {
        if (options.onJoinedGame) {
            options.onJoinedGame(data);
        }
    });

    socket.on('keyEvent', function (keyEvent) {
        if (options.onKeyEvent) {
            options.onKeyEvent(keyEvent);
        }
    });

    socket.on('playerPosition', function (data) {
        if (options.onPlayerPosition) {
            options.onPlayerPosition(data);
        }
    });

    socket.on('obstacleDamage', function (data) {
        if (options.onObstacleDamage) {
            options.onObstacleDamage(data);
        }
    });

    socket.on('newClient', function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    socket.on('modelUpdate', function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    return {
        socket
    };
}
