GF.ClientRoundEndFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;
    var ROUND_END_TIMERS = ['reset', 'matchEnd', 'ritual', 'hit'];

    function endRound(options) {
        var winnerSlot = options.getPlayerSlot(options.winnerId);

        options.setRoundState(RoundState.ROUND_OVER);
        options.closeNameEditor();
        options.roundData.clearRoundPauseFlags();

        if (winnerSlot >= 0) {
            options.scoreKeeper.addPoint(winnerSlot);
            options.setRoundMessage(
                'PLAYER ' + options.players.label(options.winnerId) + ' WINS'
            );
        } else {
            options.setRoundMessage('TIME');
        }

        clearRoundActivity(options);

        options.timers.set(
            'reset',
            options.resetRound,
            GF.Config.round.resetDelay
        );
    }

    function endGame(options) {
        options.setRoundState(RoundState.GAME_OVER);
        options.closeNameEditor();
        recordGameResult(options);
        options.roundData.resetRoundFlags();
        options.setRoundMessage(
            options.scoreKeeper.getGameOverMessage(
                options.model && options.model.clients,
                options.getClientName
            )
        );

        clearRoundActivity(options);

        options.timers.set(
            'reset',
            options.resetToStartScreen,
            GF.Config.round.gameOverDelay
        );
    }

    function recordGameResult(options) {
        var result;

        if (!options.socket) {
            return false;
        }

        result = options.scoreKeeper.createGameResult(
            options.model,
            options.getClientName
        );

        if (!result) {
            return false;
        }

        options.socket.emit('recordGameResult', result);

        return true;
    }

    function clearRoundActivity(options) {
        options.renderHud();
        options.players.clearKeys();
        options.bullets.clear();
        options.timers.clearMany(ROUND_END_TIMERS);
        options.roundIntro.clear();
    }

    return {
        endGame: endGame,
        endRound: endRound,
        recordGameResult: recordGameResult
    };
})();
