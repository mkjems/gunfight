export const RoundState = {
    WAITING: 'waiting',
    RITUAL: 'ritual',
    PLAYING: 'playing',
    HIT_PAUSE: 'hitPause',
    ROUND_OVER: 'roundOver',
    GAME_OVER: 'gameOver'
} as const;

export type RoundState = (typeof RoundState)[keyof typeof RoundState];

export const Screen = {
    LOBBY_MAIN: 'lobby-main',
    LOBBY_EDIT_NAME: 'lobby-edit-name',
    GAME: 'game',
    HIGH_SCORES: 'high-scores'
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];

export type ActiveScreenState = {
    roundState: RoundState;
    nameEditorActive?: boolean;
    highScoresVisible?: boolean;
};

const legalTransitions: Record<RoundState, RoundState[]> = {
    [RoundState.WAITING]: [RoundState.RITUAL, RoundState.WAITING],
    [RoundState.RITUAL]: [
        RoundState.PLAYING,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ],
    [RoundState.PLAYING]: [
        RoundState.HIT_PAUSE,
        RoundState.ROUND_OVER,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ],
    [RoundState.HIT_PAUSE]: [
        RoundState.RITUAL,
        RoundState.GAME_OVER,
        RoundState.WAITING
    ],
    [RoundState.ROUND_OVER]: [RoundState.RITUAL, RoundState.WAITING],
    [RoundState.GAME_OVER]: [RoundState.WAITING]
};

export function isGameplayRoundState(roundState: RoundState): boolean {
    return roundState !== RoundState.WAITING;
}

export function getActiveScreen(state: ActiveScreenState): Screen {
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

export function canTransition(
    fromState?: RoundState | null,
    toState?: RoundState | null
): boolean {
    if (!fromState || fromState === toState) {
        return true;
    }

    if (!toState) {
        return false;
    }

    return legalTransitions[fromState].indexOf(toState) >= 0;
}

export const ClientScreens = {
    RoundState,
    Screen,
    canTransition,
    getActiveScreen,
    isGameplayRoundState
};
