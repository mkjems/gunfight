GF.Collision = {
    boxesOverlap: function (a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    },

    findBulletHit: function (bullets, players) {
        var hit = null;

        Object.keys(bullets).forEach(function (bulletId) {
            var bullet = bullets[bulletId];

            if (hit || !bullet || bullet.deleteMe) {
                return;
            }

            Object.keys(players).forEach(function (targetId) {
                var target = players[targetId];

                if (
                    hit ||
                    (targetId === String(bullet.ownerId) &&
                        !bullet.hasRicocheted)
                ) {
                    return;
                }

                if (
                    GF.Collision.boxesOverlap(
                        bullet.getHitBox(),
                        target.getHitBox()
                    )
                ) {
                    hit = {
                        bullet: bullet,
                        winnerId: GF.Collision.getWinnerId(
                            bullet.ownerId,
                            targetId,
                            players
                        ),
                        targetId: targetId
                    };
                }
            });
        });

        return hit;
    },

    getWinnerId: function (ownerId, targetId, players) {
        var winnerId = ownerId;

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
};
