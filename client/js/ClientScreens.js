GF.ClientScreens = (function () {
    var RoundState = {
        WAITING: 'waiting',
        RITUAL: 'ritual',
        PLAYING: 'playing',
        HIT_PAUSE: 'hitPause',
        ROUND_OVER: 'roundOver',
        GAME_OVER: 'gameOver'
    };
    var Screen = {
        LOBBY_MAIN: 'lobby-main',
        LOBBY_EDIT_NAME: 'lobby-edit-name',
        GAME: 'game',
        HIGH_SCORES: 'high-scores'
    };
    var legalTransitions = {};

    legalTransitions[RoundState.WAITING] = [
        RoundState.RITUAL,
        RoundState.WAITING
    ];
    legalTransitions[RoundState.RITUAL] = [
        RoundState.PLAYING,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ];
    legalTransitions[RoundState.PLAYING] = [
        RoundState.HIT_PAUSE,
        RoundState.ROUND_OVER,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ];
    legalTransitions[RoundState.HIT_PAUSE] = [
        RoundState.RITUAL,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ];
    legalTransitions[RoundState.ROUND_OVER] = [
        RoundState.RITUAL,
        RoundState.WAITING
    ];
    legalTransitions[RoundState.GAME_OVER] = [RoundState.WAITING];

    function isGameplayRoundState(roundState) {
        return roundState !== RoundState.WAITING;
    }

    function getActiveScreen(state) {
        if (isGameplayRoundState(state.roundState)) {
            return Screen.GAME;
        }

        if (state.nameEditorActive) {
            return Screen.LOBBY_EDIT_NAME;
        }

        if (state.highScoresVisible) {
            return Screen.HIGH_SCORES;
        }

        return Screen.LOBBY_MAIN;
    }

    function canTransition(fromState, toState) {
        if (!fromState || fromState === toState) {
            return true;
        }

        return (legalTransitions[fromState] || []).indexOf(toState) >= 0;
    }

    return {
        RoundState: RoundState,
        Screen: Screen,
        canTransition: canTransition,
        getActiveScreen: getActiveScreen,
        isGameplayRoundState: isGameplayRoundState
    };
})();
