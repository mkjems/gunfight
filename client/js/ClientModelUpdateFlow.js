GF.ClientModelUpdateFlow = (function () {
    function sync(options) {
        var plan = GF.ClientModelUpdatePlan.create({
            model: options.model,
            playerId: options.playerId,
            previousModel: options.previousModel,
            roundState: options.roundState
        });

        if (plan.clearLocalReadyRequest) {
            options.clearLocalReadyRequest();
        }

        if (plan.syncStoredPlayerName) {
            options.syncStoredPlayerName();
        }

        if (plan.enterLobbyState) {
            options.enterLobbyState();
        }

        if (plan.scheduleAbandonedRequeue) {
            options.scheduleAbandonedRequeue();
        }

        if (plan.clearAbandonedRequeue) {
            options.clearAbandonedRequeue();
        }

        if (plan.playReadySound) {
            options.playReadySound();
        }

        options.players.sync(options.model, plan.syncPlayers);

        if (plan.syncNameEditor) {
            options.syncNameEditor();
        }

        if (plan.startRoundRitual) {
            options.startRoundRitual({ resetScores: true });
            return plan;
        }

        if (plan.renderHud) {
            options.renderHud();
        }

        return plan;
    }

    return {
        sync: sync
    };
})();
