import { handle as handleGameplayInput } from './clientGameplayInput.js';
import { RoundState } from '../state/clientScreens.js';

type KeyEvent = {
    action: string;
    key: string;
    player?: number | string;
    [key: string]: unknown;
};

type ClientKeyEventFlowOptions = {
    ammo: unknown;
    bullets: unknown;
    gameplayInput?: {
        handle: typeof handleGameplayInput;
    };
    highScoresVisible?: boolean;
    isLocalClientWaiting: () => boolean;
    keyEvent: KeyEvent;
    nameEditor?: {
        handleKeyEvent: (keyEvent: KeyEvent) => false | unknown;
    } | null;
    onBulletFired: (...args: unknown[]) => void;
    onEmptyGun: (...args: unknown[]) => void;
    onGunFired?: (...args: unknown[]) => void;
    onWaitingFire?: (...args: unknown[]) => void;
    player: unknown;
    playerId?: number | string;
    renderHud: () => void;
    returnToLobby?: () => void;
    roundState: RoundState;
    showHighScores?: () => void;
};

export function handle(options: ClientKeyEventFlowOptions) {
    const keyEvent = options.keyEvent;
    const isLocalWaitingKey =
        options.roundState === RoundState.WAITING &&
        keyEvent.player === options.playerId &&
        (keyEvent.key === 's' || !!options.highScoresVisible) &&
        options.isLocalClientWaiting();

    if (isLocalWaitingKey && keyEvent.key === 's') {
        if (keyEvent.action === 'down') {
            if (options.highScoresVisible) {
                options.returnToLobby?.();
            } else {
                options.showHighScores?.();
            }

            options.renderHud();
        }

        return false;
    }

    if (isLocalWaitingKey && options.highScoresVisible) {
        return false;
    }

    if (
        options.roundState === RoundState.WAITING &&
        keyEvent.player === options.playerId &&
        keyEvent.key === 'e' &&
        !options.isLocalClientWaiting()
    ) {
        return false;
    }

    if (
        options.roundState === RoundState.WAITING &&
        options.nameEditor &&
        keyEvent.player === options.playerId
    ) {
        if (options.nameEditor.handleKeyEvent(keyEvent) === false) {
            options.renderHud();
            return false;
        }
    }

    const gameplayInput = options.gameplayInput || {
        handle: handleGameplayInput
    };

    gameplayInput.handle({
        ammo: options.ammo as never,
        bullets: options.bullets as never,
        keyEvent: keyEvent as never,
        player: options.player as never,
        roundState: options.roundState,
        onGunFired: options.onGunFired as never,
        onWaitingFire: options.onWaitingFire as never,
        onBulletFired: options.onBulletFired as never,
        onEmptyGun: options.onEmptyGun as never
    });

    return undefined;
}

export const ClientKeyEventFlow = {
    handle
};
