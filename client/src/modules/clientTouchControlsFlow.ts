import { getTouchState } from './clientTouchState.js';

type AimPlayer = {
    getAim?: () => number;
};

type GetLocalAimLevelOptions = {
    defaultAim: number;
    player?: AimPlayer | null;
};

type UpdateOptions = {
    aimLevel?: number;
    editing?: boolean;
    getTouchState?: typeof getTouchState;
    highScoresVisible?: boolean;
    ready?: boolean;
    roundState?: Parameters<typeof getTouchState>[0]['roundState'];
    touchControls?: {
        update: (state: ReturnType<typeof getTouchState>) => void;
    } | null;
};

export function getLocalAimLevel(options: GetLocalAimLevelOptions) {
    const player = options.player;

    if (player && typeof player.getAim === 'function') {
        return player.getAim();
    }

    return options.defaultAim;
}

export function update(options: UpdateOptions) {
    if (!options.touchControls) {
        return false;
    }

    const resolveTouchState = options.getTouchState || getTouchState;

    options.touchControls.update(
        resolveTouchState({
            aimLevel: options.aimLevel,
            editing: options.editing,
            highScoresVisible: options.highScoresVisible,
            ready: options.ready,
            roundState: options.roundState
        } as never)
    );

    return true;
}

export const ClientTouchControlsFlow = {
    getLocalAimLevel,
    update
};
