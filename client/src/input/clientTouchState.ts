import { RoundState } from '../state/clientScreens.js';

type TouchStateOptions = {
    aimLevel: number;
    editing?: boolean;
    highScoresVisible?: boolean;
    ready?: boolean;
    roundState: RoundState;
};

export function shouldShowGameplayTouchControls(
    roundState: RoundState
): boolean {
    return (
        roundState === RoundState.RITUAL ||
        roundState === RoundState.PLAYING ||
        roundState === RoundState.HIT_PAUSE ||
        roundState === RoundState.ROUND_OVER
    );
}

export function getTouchState(options: TouchStateOptions) {
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

export const ClientTouchState = {
    getTouchState,
    shouldShowGameplayTouchControls
};
