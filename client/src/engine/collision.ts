type Box = {
    height: number;
    width: number;
    x: number;
    y: number;
};

type BulletLike = {
    deleteMe?: boolean;
    getHitBox: () => Box;
    hasRicocheted?: boolean;
    ownerId: string | number;
};

type PlayerLike = {
    getHitBox: () => Box;
    playerId: string | number;
};

export function boxesOverlap(a: Box, b: Box) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

export function findBulletHit(
    bullets: Record<string, BulletLike | null | undefined>,
    players: Record<string, PlayerLike>
) {
    let hit: {
        bullet: BulletLike;
        targetId: string;
        winnerId: string | number;
    } | null = null;

    Object.keys(bullets).forEach(function (bulletId) {
        const bullet = bullets[bulletId];

        if (hit || !bullet || bullet.deleteMe) {
            return;
        }

        Object.keys(players).forEach(function (targetId) {
            const target = players[targetId];

            if (
                hit ||
                (targetId === String(bullet.ownerId) && !bullet.hasRicocheted)
            ) {
                return;
            }

            if (boxesOverlap(bullet.getHitBox(), target.getHitBox())) {
                hit = {
                    bullet,
                    winnerId: getWinnerId(bullet.ownerId, targetId, players),
                    targetId
                };
            }
        });
    });

    return hit;
}

export function getWinnerId(
    ownerId: string | number,
    targetId: string,
    players: Record<string, PlayerLike>
) {
    let winnerId = ownerId;

    if (targetId !== String(ownerId)) {
        return winnerId;
    }

    Object.keys(players).forEach(function (playerId) {
        if (playerId !== targetId) {
            winnerId = players[playerId].playerId;
        }
    });

    return winnerId;
}

export const Collision = {
    boxesOverlap,
    findBulletHit,
    getWinnerId
};
