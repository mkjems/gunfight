import { RoundState } from './clientScreens.js';

type PlayerId = number | string;

type KeyEvent = {
    action: string;
    key: string;
    shot?: unknown;
};

type Player = {
    playerId: PlayerId;
    respondToKeyEvent: (keyEvent: KeyEvent) => void;
};

type Bullet = {
    toSnapshot: () => unknown;
};

type ClientGameplayInputOptions = {
    ammo: {
        hasAmmo: (playerId: PlayerId) => boolean;
        spend: (playerId: PlayerId) => void;
    };
    bullets: {
        fire: (
            player: Player,
            shot?: unknown
        ) => Bullet | false | null | undefined;
    };
    keyEvent: KeyEvent;
    onBulletFired: (bullet: Bullet) => void;
    onEmptyGun: () => void;
    onGunFired?: (bullet: Bullet) => void;
    player?: Player | null;
    roundState: RoundState;
};

export function isLockedRoundState(roundState: RoundState) {
    return (
        roundState === RoundState.RITUAL ||
        roundState === RoundState.ROUND_OVER ||
        roundState === RoundState.HIT_PAUSE ||
        roundState === RoundState.GAME_OVER
    );
}

export function handle(options: ClientGameplayInputOptions) {
    const keyEvent = options.keyEvent;
    const player = options.player;

    if (!player) {
        return;
    }

    if (isLockedRoundState(options.roundState)) {
        if (keyEvent.action === 'up') {
            player.respondToKeyEvent(keyEvent);
        }
        return;
    }

    if (keyEvent.key === ' ' && keyEvent.action === 'down') {
        let bullet: Bullet | false | null | undefined;

        if (
            options.roundState === RoundState.PLAYING &&
            options.ammo.hasAmmo(player.playerId)
        ) {
            bullet = options.bullets.fire(player, keyEvent.shot);
        } else if (options.roundState === RoundState.PLAYING) {
            options.onEmptyGun();
        }

        if (bullet) {
            if (options.onGunFired) {
                options.onGunFired(bullet);
            }

            options.ammo.spend(player.playerId);
            options.onBulletFired(bullet);

            if (!keyEvent.shot) {
                keyEvent.shot = bullet.toSnapshot();
            }
        }
        return;
    }

    player.respondToKeyEvent(keyEvent);
}

export const ClientGameplayInput = {
    handle,
    isLockedRoundState
};
