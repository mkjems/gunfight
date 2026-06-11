GF.ClientPlayerHitFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function handleHit(options) {
        var target = options.players.all[options.hit.targetId];

        options.setRoundState(RoundState.HIT_PAUSE);
        options.roundData.setHitMessage({
            targetId: options.hit.targetId,
            text: 'Got me!'
        });
        options.playPain();

        if (target) {
            target.playDeathAnimation();
        }

        options.scoreKeeper.addPoint(options.winnerSlot);
        options.roundData.setAdvanceRoundAfterHit(
            options.hit.winnerId === options.playerId
        );
        options.renderHud();
        options.players.clearKeys();
        options.bullets.clear();
        options.timers.set(
            'hit',
            options.resetAfterHit,
            GF.Config.round.resetDelay
        );
    }

    function resetAfterHit(options) {
        options.roundData.clearHitMessage();
        clearPlayerDeathAnimations(options.players);

        if (options.hasMatchTimeExpired()) {
            options.endGame();
            return;
        }

        if (options.roundData.consumeAdvanceRoundAfterHit()) {
            options.socket.emit('advanceRound');
        }

        options.bullets.reset();
        options.resetAmmo();
        options.startRoundRitual({ resetScores: false });
    }

    function clearPlayerDeathAnimations(players) {
        Object.keys(players.all).forEach(function (id) {
            players.all[id].clearDeathAnimation();
        });
    }

    return {
        clearPlayerDeathAnimations: clearPlayerDeathAnimations,
        handleHit: handleHit,
        resetAfterHit: resetAfterHit
    };
})();
