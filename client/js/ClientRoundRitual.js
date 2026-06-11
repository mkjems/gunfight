GF.ClientRoundRitual = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function start(options) {
        var getReadyDelay = Math.max(
            GF.Config.round.getReadyDelay,
            GF.Config.round.introWalkDelay
        );

        if (options.resetScores) {
            options.scoreKeeper.resetScores();
            options.roundData.clearRoundEnd();
        }

        options.setRoundState(RoundState.RITUAL);
        options.closeNameEditor();
        options.roundData.startScenario();
        options.roundData.clearObstacleDamage();
        options.bullets.reset();
        options.resetAmmo();
        options.roundIntro.start();
        options.setRoundMessage('GET READY');
        options.renderHud();

        options.timers.set(
            'ritual',
            function () {
                if (options.hasMatchTimeExpired()) {
                    options.endGame();
                    return;
                }

                options.roundIntro.complete();
                options.setRoundMessage('DRAW!');

                options.timers.set(
                    'ritual',
                    function () {
                        if (options.hasMatchTimeExpired()) {
                            options.endGame();
                            return;
                        }

                        options.setRoundMessage('');
                        if (!options.roundData.getRoundEndsAt()) {
                            options.roundData.setRoundEndsAt(
                                new Date().getTime() +
                                    GF.Config.game.seconds * 1000
                            );
                            options.scheduleMatchEnd();
                        }
                        options.resetAmmo();
                        options.setRoundState(RoundState.PLAYING);
                        options.renderHud();
                    },
                    GF.Config.round.drawDelay
                );
            },
            getReadyDelay
        );
    }

    return {
        start: start
    };
})();
