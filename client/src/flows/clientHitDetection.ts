import { RoundState } from '../state/clientScreens.js';

type Bullet = {
    deleteMe?: boolean;
    getHitBox: () => {
        height: number;
        width: number;
        x: number;
        y: number;
    };
    hasRicocheted?: boolean;
    ownerId: number | string;
};

type Hit = {
    bullet: Bullet;
};

type Player = {
    getHitBox: () => {
        height: number;
        width: number;
        x: number;
        y: number;
    };
    playerId: number | string;
};

type ClientHitDetectionOptions = {
    bullets?: {
        all: () => Record<string, Bullet | null | undefined>;
    };
    collision?: {
        findBulletHit: (
            bullets: Record<string, Bullet | null | undefined>,
            players: Record<string, Player>
        ) => Hit | null;
    };
    findBulletObstacleHit?: () => Hit | null;
    matchTimeExpired?: boolean;
    players?: {
        all: Record<string, Player>;
    };
    roundState: RoundState;
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

    const collision = options.collision;
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
