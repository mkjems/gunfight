import { RoundState } from './clientScreens.js';

type Bullet = {
    deleteMe?: boolean;
};

type Hit = {
    bullet: Bullet;
};

type ClientHitDetectionOptions = {
    bullets?: {
        all: () => unknown;
    };
    collision?: {
        findBulletHit: (bullets: unknown, players: unknown) => Hit | null;
    };
    findBulletObstacleHit?: () => Hit | null;
    matchTimeExpired?: boolean;
    players?: {
        all: unknown;
    };
    roundState: RoundState;
};

type GlobalWithCollision = typeof globalThis & {
    GF?: {
        Collision?: {
            findBulletHit: (bullets: unknown, players: unknown) => Hit | null;
        };
    };
};

export function check(options: ClientHitDetectionOptions) {
    if (options.roundState !== RoundState.PLAYING) {
        if (
            options.roundState === RoundState.HIT_PAUSE &&
            options.matchTimeExpired
        ) {
            return {
                type: 'matchExpired'
            };
        }

        return {
            type: 'none'
        };
    }

    const obstacleHit = options.findBulletObstacleHit?.() || null;

    if (obstacleHit) {
        obstacleHit.bullet.deleteMe = true;

        return {
            hit: obstacleHit,
            type: 'obstacleHit'
        };
    }

    const collision =
        options.collision || (globalThis as GlobalWithCollision).GF?.Collision;
    const playerHit =
        collision && options.bullets && options.players
            ? collision.findBulletHit(
                  options.bullets.all(),
                  options.players.all
              )
            : null;

    if (playerHit) {
        playerHit.bullet.deleteMe = true;

        return {
            hit: playerHit,
            type: 'playerHit'
        };
    }

    if (options.matchTimeExpired) {
        return {
            type: 'matchExpired'
        };
    }

    return {
        type: 'none'
    };
}

export const ClientHitDetection = {
    check
};
