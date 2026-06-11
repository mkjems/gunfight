GF.ClientModelUpdatePlan = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function create(options) {
        var syncState = GF.ClientModelSync.analyze(
            options.previousModel,
            options.model,
            options.playerId
        );
        var shouldStartRound =
            options.roundState === RoundState.WAITING && syncState.readyToStart;

        return {
            clearAbandonedRequeue: !syncState.abandoned,
            clearLocalReadyRequest: syncState.clearLocalReadyRequest,
            enterLobbyState: syncState.abandoned,
            playReadySound: syncState.clientBecameReady,
            renderHud: !shouldStartRound,
            scheduleAbandonedRequeue: syncState.abandoned,
            startRoundRitual: shouldStartRound,
            syncNameEditor: true,
            syncStoredPlayerName: true,
            syncPlayers: {
                resetChangedSlots: options.roundState === RoundState.WAITING,
                slots:
                    options.roundState === RoundState.WAITING
                        ? GF.Config.player.lobbySlots
                        : GF.Config.player.slots
            }
        };
    }

    return {
        create: create
    };
})();
