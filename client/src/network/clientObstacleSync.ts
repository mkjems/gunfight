import type { SocketEvent } from '../../../shared/contracts.js';

const SOCKET_EVENT = {
    ObstacleDamage: 'obstacleDamage'
} as const satisfies Record<string, SocketEvent>;

type ClientId = number | string;

type ObstacleDamagePayload = {
    id: string;
    ownerId: ClientId;
    roundNumber?: number;
};

type ObstacleHit = {
    bullet: {
        ownerId: ClientId;
    };
    obstacleId: string;
};

type RoundModel = {
    roundNumber?: number;
};

type HandleLocalHitOptions = {
    applyDamage: (payload: ObstacleDamagePayload) => void;
    hit: ObstacleHit;
    model?: RoundModel | null;
    playerId: ClientId;
    socket: {
        emit: (
            event: typeof SOCKET_EVENT.ObstacleDamage,
            payload: ObstacleDamagePayload
        ) => void;
    };
};

type ApplyDamageOptions = {
    bullets: {
        remove: (ownerId: ClientId) => void;
    };
    damageObstacle: (id: string) => void;
    data: ObstacleDamagePayload;
    model?: RoundModel | null;
    playObstacleHit: (id: string) => void;
};

export function handleLocalHit(options: HandleLocalHitOptions) {
    const hit = options.hit;
    const roundNumber = options.model?.roundNumber;

    if (hit.bullet.ownerId !== options.playerId) {
        return false;
    }

    const payload = {
        id: hit.obstacleId,
        ownerId: hit.bullet.ownerId,
        roundNumber
    };

    options.applyDamage(payload);
    options.socket.emit(SOCKET_EVENT.ObstacleDamage, payload);

    return true;
}

export function applyDamage(options: ApplyDamageOptions) {
    const data = options.data;

    if (options.model && data.roundNumber !== options.model.roundNumber) {
        return false;
    }

    options.damageObstacle(data.id);
    options.playObstacleHit(data.id);
    options.bullets.remove(data.ownerId);

    return true;
}

export const ClientObstacleSync = {
    applyDamage,
    handleLocalHit
};
