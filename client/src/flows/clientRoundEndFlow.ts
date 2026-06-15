import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';
import { CLIENT_TIMER, type ClientTimerName } from '../state/clientTimers.js';

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
    timers: {
        clearMany: (names: string[]) => void;
        set: (
            name: typeof CLIENT_TIMER.Reset,
            callback: () => void,
            delay: number
        ) => void;
    };
    winnerId?: ClientId | null;
};

const ROUND_END_TIMERS: ClientTimerName[] = [
    CLIENT_TIMER.Reset,
    CLIENT_TIMER.MatchEnd,
    CLIENT_TIMER.Ritual,
    CLIENT_TIMER.Hit
];

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

    options.timers.set(
        CLIENT_TIMER.Reset,
        options.resetRound,
        Config.round.resetDelay
    );
}

export function endGame(options: RoundEndOptions) {
    options.setRoundState(RoundState.GAME_OVER);
    options.closeNameEditor();
    options.roundData.resetRoundFlags();
    options.setRoundMessage(
        options.scoreKeeper.getGameOverMessage(
            options.model?.clients,
            options.getClientName
        )
    );

    clearRoundActivity(options);

    const reset = options.resetToStartScreen || options.resetRound;

    if (reset) {
        options.timers.set(
            CLIENT_TIMER.Reset,
            reset,
            Config.round.gameOverDelay
        );
    }
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
    endRound
};
