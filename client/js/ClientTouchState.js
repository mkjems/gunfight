GF.ClientTouchState = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function shouldShowGameplayTouchControls(roundState) {
        return (
            roundState === RoundState.RITUAL ||
            roundState === RoundState.PLAYING ||
            roundState === RoundState.HIT_PAUSE ||
            roundState === RoundState.ROUND_OVER
        );
    }

    function getTouchState(options) {
        return {
            gameplay: shouldShowGameplayTouchControls(options.roundState),
            waiting: options.roundState === RoundState.WAITING,
            playing: options.roundState === RoundState.PLAYING,
            editing: !!options.editing,
            highScoresVisible:
                options.roundState === RoundState.WAITING &&
                !!options.highScoresVisible,
            ready: !!options.ready,
            aimLevel: options.aimLevel
        };
    }

    return {
        getTouchState: getTouchState,
        shouldShowGameplayTouchControls: shouldShowGameplayTouchControls
    };
})();
