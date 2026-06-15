import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';

type ClientId = number | string;

type RoundEndClient = {
    name?: string;
    slot: number;
};

type RoundEndModel = {
    clients?: RoundEndClient[];
    gameId?: string;
    roundNumber?: number;
};

type RoundEndOptions = {
    bullets: {
        clear: () => void;
    };
    closeNameEditor: () => void;
    getClientName?: (client: RoundEndClient) => string;
    getPlayerSlot?: (id?: ClientId | null) => number;
    model?: RoundEndModel | null;
    players: {
        clearKeys: () => void;
        label: (id?: ClientId | null) => string;
    };
    renderHud: () => void;
    resetRound?: () => void;
    resetToStartScreen?: () => void;
    roundData: {
        clearRoundPauseFlags: () => void;
        resetRoundFlags: () => void;
    };
    roundIntro: {
        clear: () => void;
    };
    scoreKeeper: {
        getGameOverMessage: (
            clients: RoundEndClient[] | undefined,
            getClientName?: RoundEndOptions['getClientName']
        ) => string;
    };
    setRoundMessage: (message: string) => void;
    setRoundState: (roundState: RoundState) => void;
    socket?: {
        emit: (event: 'matchExpired') => void;
    } | null;
    timers: {
        clearMany: (names: string[]) => void;
        set: (name: 'reset', callback: () => void, delay: number) => void;
    };
    notifyServer?: boolean;
    winnerId?: ClientId | null;
};

const ROUND_END_TIMERS = ['reset', 'matchEnd', 'ritual', 'hit'];

export function endRound(options: RoundEndOptions) {
    const winnerSlot = options.getPlayerSlot
        ? options.getPlayerSlot(options.winnerId)
        : -1;

    options.setRoundState(RoundState.ROUND_OVER);
    options.closeNameEditor();
    options.roundData.clearRoundPauseFlags();

    if (winnerSlot >= 0) {
        options.setRoundMessage(
            'PLAYER ' + options.players.label(options.winnerId) + ' WINS'
        );
    } else {
        options.setRoundMessage('TIME');
    }

    clearRoundActivity(options);

    if (!options.resetRound) {
        return;
    }

    options.timers.set('reset', options.resetRound, Config.round.resetDelay);
}

export function endGame(options: RoundEndOptions) {
    options.setRoundState(RoundState.GAME_OVER);
    options.closeNameEditor();
    notifyMatchExpired(options);
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
        options.resetToStartScreen || options.resetRound || function () {},
        Config.round.gameOverDelay
    );
}

export function notifyMatchExpired(options: RoundEndOptions) {
    if (options.notifyServer === false || !options.socket) {
        return false;
    }

    options.socket.emit('matchExpired');

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
    notifyMatchExpired
};
