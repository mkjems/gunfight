import { Config } from './config.js';
import { RoundState } from './clientScreens.js';

type ClientId = number | string;

type RoundEndOptions = {
    bullets: {
        clear: () => void;
    };
    closeNameEditor: () => void;
    getClientName?: (client: unknown) => string;
    getPlayerSlot: (id?: ClientId | null) => number;
    model?: {
        clients?: unknown[];
    } | null;
    players: {
        clearKeys: () => void;
        label: (id?: ClientId | null) => string;
    };
    renderHud: () => void;
    resetRound: () => void;
    resetToStartScreen?: () => void;
    roundData: {
        clearRoundPauseFlags: () => void;
        resetRoundFlags: () => void;
    };
    roundIntro: {
        clear: () => void;
    };
    scoreKeeper: {
        addPoint: (slot: number) => void;
        createGameResult?: (
            model: RoundEndOptions['model'],
            getClientName?: RoundEndOptions['getClientName']
        ) => unknown;
        getGameOverMessage: (
            clients: unknown[] | undefined,
            getClientName?: RoundEndOptions['getClientName']
        ) => string;
    };
    setRoundMessage: (message: string) => void;
    setRoundState: (roundState: RoundState) => void;
    socket?: {
        emit: (event: 'recordGameResult', payload: unknown) => void;
    } | null;
    timers: {
        clearMany: (names: string[]) => void;
        set: (name: 'reset', callback: () => void, delay: number) => void;
    };
    winnerId?: ClientId | null;
};

const ROUND_END_TIMERS = ['reset', 'matchEnd', 'ritual', 'hit'];

export function endRound(options: RoundEndOptions) {
    const winnerSlot = options.getPlayerSlot(options.winnerId);

    options.setRoundState(RoundState.ROUND_OVER);
    options.closeNameEditor();
    options.roundData.clearRoundPauseFlags();

    if (winnerSlot >= 0) {
        options.scoreKeeper.addPoint(winnerSlot);
        options.setRoundMessage(
            'PLAYER ' + options.players.label(options.winnerId) + ' WINS'
        );
    } else {
        options.setRoundMessage('TIME');
    }

    clearRoundActivity(options);

    options.timers.set('reset', options.resetRound, Config.round.resetDelay);
}

export function endGame(options: RoundEndOptions) {
    options.setRoundState(RoundState.GAME_OVER);
    options.closeNameEditor();
    recordGameResult(options);
    options.roundData.resetRoundFlags();
    options.setRoundMessage(
        options.scoreKeeper.getGameOverMessage(
            options.model?.clients,
            options.getClientName
        )
    );

    clearRoundActivity(options);

    options.timers.set(
        'reset',
        options.resetToStartScreen || options.resetRound,
        Config.round.gameOverDelay
    );
}

export function recordGameResult(options: RoundEndOptions) {
    if (!options.socket || !options.scoreKeeper.createGameResult) {
        return false;
    }

    const result = options.scoreKeeper.createGameResult(
        options.model,
        options.getClientName
    );

    if (!result) {
        return false;
    }

    options.socket.emit('recordGameResult', result);

    return true;
}

function clearRoundActivity(options: RoundEndOptions) {
    options.renderHud();
    options.players.clearKeys();
    options.bullets.clear();
    options.timers.clearMany(ROUND_END_TIMERS);
    options.roundIntro.clear();
}

export const ClientRoundEndFlow = {
    endGame,
    endRound,
    recordGameResult
};
