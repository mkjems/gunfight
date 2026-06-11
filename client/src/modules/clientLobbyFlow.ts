import { Config } from './config.js';
import { RoundState } from './clientScreens.js';

type ClientLobbyFlowOptions = {
    bullets: {
        clear: () => void;
    };
    players: {
        clearKeys: () => void;
    };
    roundData: {
        resetRoundFlags: () => void;
    };
    roundIntro: {
        clear: () => void;
    };
    scoreKeeper: {
        resetRecordedResult: () => void;
    };
    setRoundState: (roundState: RoundState) => void;
    socket?: {
        emit: (event: 'requeue') => void;
    } | null;
    syncNameEditor: () => void;
    timers: {
        clear: (name: 'abandonedRequeue') => void;
        clearMany: (names: string[]) => void;
        has: (name: 'abandonedRequeue') => boolean;
        set: (
            name: 'abandonedRequeue',
            callback: () => void,
            delay: number
        ) => void;
    };
};

const LOBBY_ENTRY_TIMERS = ['ritual', 'hit', 'reset', 'abandonedRequeue'];

export function enter(options: ClientLobbyFlowOptions) {
    options.timers.clearMany(LOBBY_ENTRY_TIMERS);
    options.roundIntro.clear();
    options.roundData.resetRoundFlags();
    options.setRoundState(RoundState.WAITING);
    options.scoreKeeper.resetRecordedResult();
    options.players.clearKeys();
    options.bullets.clear();
    options.syncNameEditor();
}

export function scheduleAbandonedRequeue(options: ClientLobbyFlowOptions) {
    if (options.timers.has('abandonedRequeue') || !options.socket) {
        return false;
    }

    options.timers.set(
        'abandonedRequeue',
        function () {
            options.socket?.emit('requeue');
        },
        Config.round.abandonedRequeueDelay
    );

    return true;
}

export function clearAbandonedRequeue(options: ClientLobbyFlowOptions) {
    options.timers.clear('abandonedRequeue');
}

export const ClientLobbyFlow = {
    clearAbandonedRequeue,
    enter,
    scheduleAbandonedRequeue
};
