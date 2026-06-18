export const DuelState = {
    WAITING: 'waiting',
    RITUAL: 'ritual',
    PLAYING: 'playing',
    HIT_PAUSE: 'hitPause',
    DUEL_OVER: 'duelOver',
    GAME_OVER: 'gameOver'
} as const;

export type DuelState = (typeof DuelState)[keyof typeof DuelState];

export const Screen = {
    LOBBY_MAIN: 'lobby-main',
    LOBBY_EDIT_NAME: 'lobby-edit-name',
    GAME: 'game',
    HIGH_SCORES: 'high-scores'
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];

export type ActiveScreenState = {
    duelState: DuelState;
    nameEditorActive?: boolean;
    highScoresVisible?: boolean;
};

const legalTransitions: Record<DuelState, DuelState[]> = {
    [DuelState.WAITING]: [DuelState.RITUAL, DuelState.WAITING],
    [DuelState.RITUAL]: [
        DuelState.PLAYING,
        DuelState.GAME_OVER,
        DuelState.WAITING
    ],
    [DuelState.PLAYING]: [
        DuelState.HIT_PAUSE,
        DuelState.DUEL_OVER,
        DuelState.GAME_OVER,
        DuelState.WAITING
    ],
    [DuelState.HIT_PAUSE]: [
        DuelState.RITUAL,
        DuelState.GAME_OVER,
        DuelState.WAITING
    ],
    [DuelState.DUEL_OVER]: [DuelState.RITUAL, DuelState.WAITING],
    [DuelState.GAME_OVER]: [DuelState.WAITING]
};

export function isGameplayDuelState(duelState: DuelState): boolean {
    return duelState !== DuelState.WAITING;
}

export function getActiveScreen(state: ActiveScreenState): Screen {
    if (isGameplayDuelState(state.duelState)) {
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
    fromState?: DuelState | null,
    toState?: DuelState | null
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
    DuelState,
    Screen,
    canTransition,
    getActiveScreen,
    isGameplayDuelState
};
