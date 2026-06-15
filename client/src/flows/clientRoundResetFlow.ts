import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';

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
    socket?: {
        emit: (event: 'resetReady') => void;
    };
    syncNameEditor: () => void;
    timers: {
        clearMany: (names: string[]) => void;
    };
};

type ResetToStartScreenOptions = Omit<
    ClientRoundResetOptions,
    'socket' | 'resetAmmo'
> & {
    resetAmmo: () => void;
    socket: {
        emit: (event: 'resetReady') => void;
    };
};

type SharedRoundResetOptions = Pick<
    ClientRoundResetOptions,
    'bullets' | 'roundData' | 'setRoundMessage' | 'timers'
>;

type WaitingStateOptions = Pick<
    ClientRoundResetOptions,
    'renderHud' | 'setRoundState' | 'syncNameEditor'
>;

const RESET_TIMERS = ['reset', 'matchEnd'];

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
    options.socket.emit('resetReady');
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
