import { Config } from './config.js';
import { RoundState } from './clientScreens.js';

type ClientId = number | string;

type Player = {
    clearDeathAnimation: () => void;
    playDeathAnimation?: () => void;
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
    playerId: ClientId;
    players: Players;
    playPain: () => void;
    renderHud: () => void;
    resetAfterHit: () => void;
    roundData: {
        setAdvanceRoundAfterHit: (value: boolean) => void;
        setHitMessage: (message: { targetId: ClientId; text: string }) => void;
    };
    scoreKeeper: {
        addPoint: (slot: number) => void;
    };
    setRoundState: (roundState: RoundState) => void;
    timers: {
        set: (name: 'hit', callback: () => void, delay: number) => void;
    };
    winnerSlot: number;
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
        consumeAdvanceRoundAfterHit?: () => boolean;
    };
    socket: {
        emit: (event: 'advanceRound') => void;
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

    options.scoreKeeper.addPoint(options.winnerSlot);
    options.roundData.setAdvanceRoundAfterHit(
        options.hit.winnerId === options.playerId
    );
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

    if (options.roundData.consumeAdvanceRoundAfterHit?.()) {
        options.socket.emit('advanceRound');
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
