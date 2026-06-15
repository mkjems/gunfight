import type { SocketEvent } from '../../../shared/contracts.js';

const SOCKET_EVENT = {
    PlayerPosition: 'playerPosition'
} as const satisfies Record<string, SocketEvent>;

type PlayerId = number | string;

type PositionPlayer = {
    aim: unknown;
    facing: unknown;
    frame: number;
    x: number;
    y: number;
};

type PositionSocket = {
    emit: (
        event: typeof SOCKET_EVENT.PlayerPosition,
        payload: {
            aim: unknown;
            facing: unknown;
            frame: number;
            x: number;
            y: number;
        }
    ) => void;
};

type PlayerPositionSyncOptions = {
    getTime?: () => number;
    syncInterval?: number;
};

type SyncLocalOptions = {
    player?: PositionPlayer | null;
    playing: boolean;
    socket?: PositionSocket | null;
};

type RemotePositionData = {
    aim: unknown;
    facing: unknown;
    frame: number;
    player: PlayerId;
    x: number;
    y: number;
};

type ApplyRemoteOptions = {
    data?: RemotePositionData | null;
    localPlayerId?: PlayerId | null;
    players?: {
        all?: Record<string, PositionPlayer | undefined>;
    } | null;
    playing: boolean;
};

export function PlayerPositionSync(options: PlayerPositionSyncOptions = {}) {
    let lastPositionSyncAt = 0;
    const getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    const syncInterval = options.syncInterval || 80;

    function syncLocal(options: SyncLocalOptions) {
        const now = getTime();
        const player = options.player;
        const socket = options.socket;

        if (
            !options.playing ||
            !player ||
            !socket ||
            now - lastPositionSyncAt < syncInterval
        ) {
            return false;
        }

        lastPositionSyncAt = now;
        socket.emit(SOCKET_EVENT.PlayerPosition, {
            x: player.x,
            y: player.y,
            frame: player.frame,
            aim: player.aim,
            facing: player.facing
        });

        return true;
    }

    function applyRemote(options: ApplyRemoteOptions) {
        const data = options.data;

        if (
            !data ||
            !options.playing ||
            data.player === options.localPlayerId ||
            !options.players ||
            !options.players.all
        ) {
            return false;
        }

        const player = options.players.all[data.player];

        if (!player) {
            return false;
        }

        player.x = data.x;
        player.y = data.y;
        player.frame = data.frame;
        player.aim = data.aim;
        player.facing = data.facing;

        return true;
    }

    return {
        applyRemote,
        syncLocal
    };
}
