GF.GameHudViewModel = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function getState(options) {
        return {
            leftScore: options.scoreKeeper.getScore(0),
            rightScore: options.scoreKeeper.getScore(1),
            timerLabel: getTimerLabel(options),
            roundMessage: options.roundData.getRoundMessage(),
            hitMessage: getHitMessage(options)
        };
    }

    function getTimerLabel(options) {
        if (options.roundState === RoundState.GAME_OVER) {
            return 'GAME OVER';
        }

        return options.roundData.getSecondsLeft(options.defaultSeconds);
    }

    function getHitMessage(options) {
        var hitMessage = options.roundData.getHitMessage();
        var target;
        var point;

        if (!hitMessage) {
            return null;
        }

        target = options.players.all[hitMessage.targetId];

        if (!target) {
            return null;
        }

        point = options.cameraController.worldToHudPoint({
            camera: options.camera,
            roundState: options.roundState,
            x: target.x,
            y: Math.max(80, target.y - 150)
        });

        return {
            text: hitMessage.text,
            x: point.x,
            y: point.y
        };
    }

    return {
        getHitMessage: getHitMessage,
        getState: getState,
        getTimerLabel: getTimerLabel
    };
})();
