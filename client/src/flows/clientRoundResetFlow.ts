import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';
import { CLIENT_TIMER, type ClientTimerName } from '../state/clientTimers.js';

type ClientRoundResetOptions = {
    bullets: {
        reset: () => void;
    };
    players: {
        resetAll: (options: { slots: typeof Config.player.slots }) => void;
    };
    renderHud: () => void;
    resetAmmo?: () => void;
    roundData: {
        resetRoundFlags: () => void;
    };
    setRoundMessage: (message: string) => void;
    setRoundState: (roundState: RoundState) => void;
    syncNameEditor: () => void;
    timers: {
        clearMany: (names: string[]) => void;
    };
};

type ResetToStartScreenOptions = Omit<ClientRoundResetOptions, 'resetAmmo'> & {
    resetAmmo: () => void;
};

type SharedRoundResetOptions = Pick<
    ClientRoundResetOptions,
    'bullets' | 'roundData' | 'setRoundMessage' | 'timers'
>;

type WaitingStateOptions = Pick<
    ClientRoundResetOptions,
    'renderHud' | 'setRoundState' | 'syncNameEditor'
>;

const RESET_TIMERS: ClientTimerName[] = [
    CLIENT_TIMER.Reset,
    CLIENT_TIMER.MatchEnd
];

export function resetRound(options: ClientRoundResetOptions) {
    options.players.resetAll({
        slots: Config.player.lobbySlots
    });
    resetSharedRoundState(options);
    showWaitingState(options);
}

export function resetToStartScreen(options: ResetToStartScreenOptions) {
    options.players.resetAll({
        slots: Config.player.lobbySlots
    });
    resetSharedRoundState(options);
    options.resetAmmo();
    showWaitingState(options);
}

function resetSharedRoundState(options: SharedRoundResetOptions) {
    options.bullets.reset();
    options.setRoundMessage('');
    options.roundData.resetRoundFlags();
    options.timers.clearMany(RESET_TIMERS);
}

function showWaitingState(options: WaitingStateOptions) {
    options.setRoundState(RoundState.WAITING);
    options.syncNameEditor();
    options.renderHud();
}

export const ClientRoundResetFlow = {
    resetRound,
    resetToStartScreen
};
