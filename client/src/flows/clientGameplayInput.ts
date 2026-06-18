import { DuelState } from '../state/clientScreens.js';

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
    onWaitingFire?: (player: Player) => void;
    player?: Player | null;
    duelState: DuelState;
};

export function isLockedDuelState(duelState: DuelState) {
    return (
        duelState === DuelState.RITUAL ||
        duelState === DuelState.DUEL_OVER ||
        duelState === DuelState.HIT_PAUSE ||
        duelState === DuelState.GAME_OVER
    );
}

export function handle(options: ClientGameplayInputOptions) {
    const keyEvent = options.keyEvent;
    const player = options.player;

    if (!player) {
        return;
    }

    if (isLockedDuelState(options.duelState)) {
        if (keyEvent.action === 'up') {
            player.respondToKeyEvent(keyEvent);
        }
        return;
    }

    if (keyEvent.key === ' ' && keyEvent.action === 'down') {
        if (options.duelState === DuelState.WAITING) {
            options.onWaitingFire?.(player);
            return;
        }

        let bullet: Bullet | false | null | undefined;

        if (
            options.duelState === DuelState.PLAYING &&
            options.ammo.hasAmmo(player.playerId)
        ) {
            bullet = options.bullets.fire(player, keyEvent.shot);
        } else if (options.duelState === DuelState.PLAYING) {
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
    isLockedDuelState
};
