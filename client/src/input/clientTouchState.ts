import { DuelState } from '../state/clientScreens.js';

type TouchStateOptions = {
    aimLevel: number;
    canPlay?: boolean;
    editing?: boolean;
    highScoresVisible?: boolean;
    ready?: boolean;
    duelState: DuelState;
};

export function shouldShowGameplayTouchControls(duelState: DuelState): boolean {
    return (
        duelState === DuelState.RITUAL ||
        duelState === DuelState.PLAYING ||
        duelState === DuelState.HIT_PAUSE ||
        duelState === DuelState.DUEL_OVER
    );
}

export function getTouchState(options: TouchStateOptions) {
    return {
        gameplay: shouldShowGameplayTouchControls(options.duelState),
        waiting: options.duelState === DuelState.WAITING,
        playing: options.duelState === DuelState.PLAYING,
        editing: !!options.editing,
        highScoresVisible:
            options.duelState === DuelState.WAITING &&
            !!options.highScoresVisible,
        canPlay: !!options.canPlay,
        ready: !!options.ready,
        aimLevel: options.aimLevel
    };
}

export const ClientTouchState = {
    getTouchState,
    shouldShowGameplayTouchControls
};
