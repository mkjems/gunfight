GF.ClientGameplayInput = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function isLockedRoundState(roundState) {
        return (
            roundState === RoundState.RITUAL ||
            roundState === RoundState.ROUND_OVER ||
            roundState === RoundState.HIT_PAUSE ||
            roundState === RoundState.GAME_OVER
        );
    }

    function handle(options) {
        var keyEvent = options.keyEvent;
        var player = options.player;
        var bullet;

        if (!player) {
            return;
        }

        if (isLockedRoundState(options.roundState)) {
            if (keyEvent.action === 'up') {
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if (keyEvent.key === ' ' && keyEvent.action === 'down') {
            if (
                options.roundState === RoundState.PLAYING &&
                options.ammo.hasAmmo(player.playerId)
            ) {
                bullet = options.bullets.fire(player, keyEvent.shot);
            } else if (options.roundState === RoundState.PLAYING) {
                options.onEmptyGun();
            }

            if (bullet) {
                if (options.onGunFired) {
                    options.onGunFired(bullet);
                }

                options.ammo.spend(player.playerId);
                options.onBulletFired(bullet);

                if (!keyEvent.shot) {
                    keyEvent.shot = bullet.toSnapshot();
                }
            }
            return;
        }

        player.respondToKeyEvent(keyEvent);
    }

    return {
        handle: handle,
        isLockedRoundState: isLockedRoundState
    };
})();
