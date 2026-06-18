import { Config } from '../platform/config.js';
import { DuelState } from '../state/clientScreens.js';
import { CLIENT_TIMER, type ClientTimerName } from '../state/clientTimers.js';

type ClientDuelResetOptions = {
    bullets: {
        reset: () => void;
    };
    players: {
        resetAll: (options: {
            showStraightnessMeter?: boolean;
            slots: typeof Config.player.slots;
        }) => void;
    };
    renderHud: () => void;
    resetAmmo?: () => void;
    duelData: {
        resetDuelFlags: () => void;
    };
    setDuelMessage: (message: string) => void;
    setDuelState: (duelState: DuelState) => void;
    syncNameEditor: () => void;
    timers: {
        clearMany: (names: string[]) => void;
    };
};

type ResetToStartScreenOptions = Omit<ClientDuelResetOptions, 'resetAmmo'> & {
    resetAmmo: () => void;
};

type SharedDuelResetOptions = Pick<
    ClientDuelResetOptions,
    'bullets' | 'duelData' | 'setDuelMessage' | 'timers'
>;

type WaitingStateOptions = Pick<
    ClientDuelResetOptions,
    'renderHud' | 'setDuelState' | 'syncNameEditor'
>;

const RESET_TIMERS: ClientTimerName[] = [
    CLIENT_TIMER.Reset,
    CLIENT_TIMER.MatchEnd
];

export function resetDuel(options: ClientDuelResetOptions) {
    options.players.resetAll({
        showStraightnessMeter: false,
        slots: Config.player.lobbySlots
    });
    resetSharedDuelState(options);
    showWaitingState(options);
}

export function resetToStartScreen(options: ResetToStartScreenOptions) {
    options.players.resetAll({
        showStraightnessMeter: false,
        slots: Config.player.lobbySlots
    });
    resetSharedDuelState(options);
    options.resetAmmo();
    showWaitingState(options);
}

function resetSharedDuelState(options: SharedDuelResetOptions) {
    options.bullets.reset();
    options.setDuelMessage('');
    options.duelData.resetDuelFlags();
    options.timers.clearMany(RESET_TIMERS);
}

function showWaitingState(options: WaitingStateOptions) {
    options.setDuelState(DuelState.WAITING);
    options.syncNameEditor();
    options.renderHud();
}

export const ClientDuelResetFlow = {
    resetDuel,
    resetToStartScreen
};
