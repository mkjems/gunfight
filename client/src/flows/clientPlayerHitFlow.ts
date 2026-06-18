import type { SocketEvent } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { DuelState } from '../state/clientScreens.js';
import { CLIENT_TIMER } from '../state/clientTimers.js';

const SOCKET_EVENT = {
    DuelResult: 'duelResult'
} as const satisfies Record<string, SocketEvent>;

type ClientId = number | string;

type Player = {
    clearDeathAnimation: () => void;
    playDeathAnimation?: () => void;
};

type DuelResultModel = {
    duelNumber?: number;
};

type Players = {
    all: Record<string, Player | undefined>;
    clearKeys: () => void;
};

type HandleHitOptions = {
    bullets: {
        clear: () => void;
    };
    hit: {
        targetId: ClientId;
        winnerId: ClientId;
    };
    model?: DuelResultModel | null;
    playerId: ClientId;
    players: Players;
    playPain: () => void;
    renderHud: () => void;
    resetAfterHit: () => void;
    duelData: {
        setHitMessage: (message: { targetId: ClientId; text: string }) => void;
    };
    setDuelState: (duelState: DuelState) => void;
    socket: {
        emit: (
            event: typeof SOCKET_EVENT.DuelResult,
            payload: {
                duelNumber: number | undefined;
                targetId: ClientId;
                winnerId: ClientId;
            }
        ) => void;
    };
    timers: {
        set: (
            name: typeof CLIENT_TIMER.Hit,
            callback: () => void,
            delay: number
        ) => void;
    };
};

type ResetAfterHitOptions = {
    bullets: {
        reset: () => void;
    };
    players: {
        all: Record<string, Player>;
    };
    resetAmmo: () => void;
    duelData: {
        clearHitMessage: () => void;
    };
};

export function handleHit(options: HandleHitOptions) {
    const target = options.players.all[options.hit.targetId];

    options.setDuelState(DuelState.HIT_PAUSE);
    options.duelData.setHitMessage({
        targetId: options.hit.targetId,
        text: 'Got me!'
    });
    options.playPain();

    if (target && target.playDeathAnimation) {
        target.playDeathAnimation();
    }

    if (options.hit.winnerId === options.playerId) {
        options.socket.emit(SOCKET_EVENT.DuelResult, {
            duelNumber: options.model?.duelNumber,
            targetId: options.hit.targetId,
            winnerId: options.hit.winnerId
        });
    }

    options.renderHud();
    options.players.clearKeys();
    options.bullets.clear();
    options.timers.set(
        CLIENT_TIMER.Hit,
        options.resetAfterHit,
        Config.duel.resetDelay
    );
}

export function resetAfterHit(options: ResetAfterHitOptions) {
    options.duelData.clearHitMessage();
    clearPlayerDeathAnimations(options.players);

    options.bullets.reset();
    options.resetAmmo();
}

export function clearPlayerDeathAnimations(players: {
    all: Record<string, Player>;
}) {
    Object.keys(players.all).forEach(function (id) {
        players.all[id].clearDeathAnimation();
    });
}

export const ClientPlayerHitFlow = {
    clearPlayerDeathAnimations,
    handleHit,
    resetAfterHit
};
