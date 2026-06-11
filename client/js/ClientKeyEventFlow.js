GF.ClientKeyEventFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function handle(options) {
        var keyEvent = options.keyEvent;

        if (
            options.roundState === RoundState.WAITING &&
            keyEvent.player === options.playerId &&
            keyEvent.key === 'e' &&
            !options.isLocalClientWaiting()
        ) {
            return false;
        }

        if (
            options.roundState === RoundState.WAITING &&
            options.nameEditor &&
            keyEvent.player === options.playerId
        ) {
            if (options.nameEditor.handleKeyEvent(keyEvent) === false) {
                options.renderHud();
                return false;
            }
        }

        GF.ClientGameplayInput.handle({
            ammo: options.ammo,
            bullets: options.bullets,
            keyEvent: keyEvent,
            player: options.player,
            roundState: options.roundState,
            onGunFired: options.onGunFired,
            onBulletFired: options.onBulletFired,
            onEmptyGun: options.onEmptyGun
        });

        return undefined;
    }

    return {
        handle: handle
    };
})();
