import type { SocketEvent } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';
import { CLIENT_TIMER, type ClientTimerName } from '../state/clientTimers.js';

const SOCKET_EVENT = {
    Requeue: 'requeue'
} as const satisfies Record<string, SocketEvent>;

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
    setRoundState: (roundState: RoundState) => void;
    socket?: {
        emit: (event: typeof SOCKET_EVENT.Requeue) => void;
    } | null;
    syncNameEditor: () => void;
    timers: {
        clear: (name: typeof CLIENT_TIMER.AbandonedRequeue) => void;
        clearMany: (names: string[]) => void;
        has: (name: typeof CLIENT_TIMER.AbandonedRequeue) => boolean;
        set: (
            name: typeof CLIENT_TIMER.AbandonedRequeue,
            callback: () => void,
            delay: number
        ) => void;
    };
};

type AbandonedRequeueOptions = Pick<
    ClientLobbyFlowOptions,
    'socket' | 'timers'
>;

type ClearAbandonedRequeueOptions = Pick<ClientLobbyFlowOptions, 'timers'>;

const LOBBY_ENTRY_TIMERS: ClientTimerName[] = [
    CLIENT_TIMER.Ritual,
    CLIENT_TIMER.Hit,
    CLIENT_TIMER.Reset,
    CLIENT_TIMER.AbandonedRequeue
];

export function enter(options: ClientLobbyFlowOptions) {
    options.timers.clearMany(LOBBY_ENTRY_TIMERS);
    options.roundIntro.clear();
    options.roundData.resetRoundFlags();
    options.setRoundState(RoundState.WAITING);
    options.players.clearKeys();
    options.bullets.clear();
    options.syncNameEditor();
}

export function scheduleAbandonedRequeue(options: AbandonedRequeueOptions) {
    if (options.timers.has(CLIENT_TIMER.AbandonedRequeue) || !options.socket) {
        return false;
    }

    options.timers.set(
        CLIENT_TIMER.AbandonedRequeue,
        function () {
            options.socket?.emit(SOCKET_EVENT.Requeue);
        },
        Config.round.abandonedRequeueDelay
    );

    return true;
}

export function clearAbandonedRequeue(options: ClearAbandonedRequeueOptions) {
    options.timers.clear(CLIENT_TIMER.AbandonedRequeue);
}

export const ClientLobbyFlow = {
    clearAbandonedRequeue,
    enter,
    scheduleAbandonedRequeue
};
