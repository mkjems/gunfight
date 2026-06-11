GF.ClientRoundResetFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;
    var RESET_TIMERS = ['reset', 'matchEnd'];

    function resetRound(options) {
        var readyToStart = options.isReadyToStart(options.model);

        options.players.resetAll({
            slots: readyToStart
                ? GF.Config.player.slots
                : GF.Config.player.lobbySlots
        });
        resetSharedRoundState(options);

        if (readyToStart) {
            options.startRoundRitual({ resetScores: false });
            return;
        }

        showWaitingState(options);
    }

    function resetToStartScreen(options) {
        options.players.resetAll({
            slots: GF.Config.player.lobbySlots
        });
        resetSharedRoundState(options);
        options.resetAmmo();
        showWaitingState(options);
        options.socket.emit('resetReady');
    }

    function resetSharedRoundState(options) {
        options.bullets.reset();
        options.setRoundMessage('');
        options.roundData.resetRoundFlags();
        options.timers.clearMany(RESET_TIMERS);
    }

    function showWaitingState(options) {
        options.setRoundState(RoundState.WAITING);
        options.syncNameEditor();
        options.renderHud();
    }

    return {
        resetRound: resetRound,
        resetToStartScreen: resetToStartScreen
    };
})();
