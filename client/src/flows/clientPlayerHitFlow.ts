import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';

type ClientId = number | string;

type Player = {
    clearDeathAnimation: () => void;
    playDeathAnimation?: () => void;
};

type RoundResultModel = {
    roundNumber?: number;
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
    model?: RoundResultModel | null;
    playerId: ClientId;
    players: Players;
    playPain: () => void;
    renderHud: () => void;
    resetAfterHit: () => void;
    roundData: {
        setHitMessage: (message: { targetId: ClientId; text: string }) => void;
    };
    setRoundState: (roundState: RoundState) => void;
    socket: {
        emit: (
            event: 'roundResult',
            payload: {
                roundNumber: number | undefined;
                targetId: ClientId;
                winnerId: ClientId;
            }
        ) => void;
    };
    timers: {
        set: (name: 'hit', callback: () => void, delay: number) => void;
    };
};

type ResetAfterHitOptions = {
    bullets: {
        reset: () => void;
    };
    endGame: () => void;
    hasMatchTimeExpired: () => boolean;
    players: {
        all: Record<string, Player>;
    };
    resetAmmo: () => void;
    roundData: {
        clearHitMessage: () => void;
    };
    startRoundRitual: (options: { resetScores: boolean }) => void;
};

export function handleHit(options: HandleHitOptions) {
    const target = options.players.all[options.hit.targetId];

    options.setRoundState(RoundState.HIT_PAUSE);
    options.roundData.setHitMessage({
        targetId: options.hit.targetId,
        text: 'Got me!'
    });
    options.playPain();

    if (target && target.playDeathAnimation) {
        target.playDeathAnimation();
    }

    if (options.hit.winnerId === options.playerId) {
        options.socket.emit('roundResult', {
            roundNumber: options.model?.roundNumber,
            targetId: options.hit.targetId,
            winnerId: options.hit.winnerId
        });
    }

    options.renderHud();
    options.players.clearKeys();
    options.bullets.clear();
    options.timers.set('hit', options.resetAfterHit, Config.round.resetDelay);
}

export function resetAfterHit(options: ResetAfterHitOptions) {
    options.roundData.clearHitMessage();
    clearPlayerDeathAnimations(options.players);

    if (options.hasMatchTimeExpired()) {
        options.endGame();
        return;
    }

    options.bullets.reset();
    options.resetAmmo();
    options.startRoundRitual({ resetScores: false });
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
