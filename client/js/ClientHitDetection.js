GF.ClientHitDetection = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function check(options) {
        var obstacleHit;
        var playerHit;

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

        obstacleHit = options.findBulletObstacleHit();

        if (obstacleHit) {
            obstacleHit.bullet.deleteMe = true;

            return {
                hit: obstacleHit,
                type: 'obstacleHit'
            };
        }

        playerHit = GF.Collision.findBulletHit(
            options.bullets.all(),
            options.players.all
        );

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

    return {
        check: check
    };
})();
