GF.ClientTouchControlsFlow = (function () {
    function getLocalAimLevel(options) {
        var player = options.player;

        if (player && typeof player.getAim === 'function') {
            return player.getAim();
        }

        return options.defaultAim;
    }

    function update(options) {
        if (!options.touchControls) {
            return false;
        }

        options.touchControls.update(
            GF.ClientTouchState.getTouchState({
                aimLevel: options.aimLevel,
                editing: options.editing,
                highScoresVisible: options.highScoresVisible,
                ready: options.ready,
                roundState: options.roundState
            })
        );

        return true;
    }

    return {
        getLocalAimLevel: getLocalAimLevel,
        update: update
    };
})();
