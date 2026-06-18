import { Config } from '../platform/config.js';
import { DuelState } from '../state/clientScreens.js';
import { CLIENT_TIMER, type ClientTimerName } from '../state/clientTimers.js';

type ClientId = number | string;

type DuelEndClient = {
    name?: string;
    slot: number;
};

type DuelEndModel = {
    clients?: DuelEndClient[];
    gameId?: string;
    duelNumber?: number;
};

type DuelEndOptions = {
    bullets: {
        clear: () => void;
    };
    closeNameEditor: () => void;
    getClientName?: (client: DuelEndClient) => string;
    getPlayerSlot?: (id?: ClientId | null) => number;
    model?: DuelEndModel | null;
    players: {
        clearKeys: () => void;
        label: (id?: ClientId | null) => string;
    };
    renderHud: () => void;
    resetDuel?: () => void;
    resetToStartScreen?: () => void;
    duelData: {
        clearDuelPauseFlags: () => void;
        resetDuelFlags: () => void;
    };
    duelIntro: {
        clear: () => void;
    };
    scoreKeeper: {
        getGameOverMessage: (
            clients: DuelEndClient[] | undefined,
            getClientName?: DuelEndOptions['getClientName']
        ) => string;
    };
    setDuelMessage: (message: string) => void;
    setDuelState: (duelState: DuelState) => void;
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

const DUEL_END_TIMERS: ClientTimerName[] = [
    CLIENT_TIMER.Reset,
    CLIENT_TIMER.MatchEnd,
    CLIENT_TIMER.Ritual,
    CLIENT_TIMER.Hit
];

export function endDuel(options: DuelEndOptions) {
    const winnerSlot = options.getPlayerSlot
        ? options.getPlayerSlot(options.winnerId)
        : -1;

    options.setDuelState(DuelState.DUEL_OVER);
    options.closeNameEditor();
    options.duelData.clearDuelPauseFlags();

    if (winnerSlot >= 0) {
        options.setDuelMessage(
            'PLAYER ' + options.players.label(options.winnerId) + ' WINS'
        );
    } else {
        options.setDuelMessage('TIME');
    }

    clearDuelActivity(options);

    if (!options.resetDuel) {
        return;
    }

    options.timers.set(
        CLIENT_TIMER.Reset,
        options.resetDuel,
        Config.duel.resetDelay
    );
}

export function endGame(options: DuelEndOptions) {
    options.setDuelState(DuelState.GAME_OVER);
    options.closeNameEditor();
    options.duelData.resetDuelFlags();
    options.setDuelMessage(
        options.scoreKeeper.getGameOverMessage(
            options.model?.clients,
            options.getClientName
        )
    );

    clearDuelActivity(options);

    const reset = options.resetToStartScreen || options.resetDuel;

    if (reset) {
        options.timers.set(
            CLIENT_TIMER.Reset,
            reset,
            Config.duel.gameOverDelay
        );
    }
}

function clearDuelActivity(options: DuelEndOptions) {
    options.renderHud();
    options.players.clearKeys();
    options.bullets.clear();
    options.timers.clearMany(DUEL_END_TIMERS);
    options.duelIntro.clear();
}

export const ClientDuelEndFlow = {
    endGame,
    endDuel
};
