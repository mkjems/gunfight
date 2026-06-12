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
        update: (state: ReturnType<typeof getTouchState>) => unknown;
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
        return undefined;
    }

    const resolveTouchState = options.getTouchState || getTouchState;

    return options.touchControls.update(
        resolveTouchState({
            aimLevel: options.aimLevel,
            editing: options.editing,
            highScoresVisible: options.highScoresVisible,
            ready: options.ready,
            roundState: options.roundState
        } as never)
    );
}

export const ClientTouchControlsFlow = {
    getLocalAimLevel,
    update
};
