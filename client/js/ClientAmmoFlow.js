GF.ClientAmmoFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function reloadIfBothPlayersAreOut(options) {
        var clients;

        if (options.roundState !== RoundState.PLAYING || !options.model) {
            return false;
        }

        clients = options.model.clients || [];

        if (clients.length < 2) {
            return false;
        }

        return options.ammo.reloadIfAllEmpty(clients);
    }

    return {
        reloadIfBothPlayersAreOut: reloadIfBothPlayersAreOut
    };
})();
