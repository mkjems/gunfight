import { Config } from './config.js';
import { RoundState } from './clientScreens.js';

type ClientRoundResetOptions = {
    bullets: {
        reset: () => void;
    };
    isReadyToStart: (model: unknown) => boolean;
    model: unknown;
    players: {
        resetAll: (options: { slots: typeof Config.player.slots }) => void;
    };
    renderHud: () => void;
    resetAmmo: () => void;
    roundData: {
        resetRoundFlags: () => void;
    };
    setRoundMessage: (message: string) => void;
    setRoundState: (roundState: RoundState) => void;
    socket: {
        emit: (event: 'resetReady') => void;
    };
    startRoundRitual: (options: { resetScores: boolean }) => void;
    syncNameEditor: () => void;
    timers: {
        clearMany: (names: string[]) => void;
    };
};

const RESET_TIMERS = ['reset', 'matchEnd'];

export function resetRound(options: ClientRoundResetOptions) {
    const readyToStart = options.isReadyToStart(options.model);

    options.players.resetAll({
        slots: readyToStart ? Config.player.slots : Config.player.lobbySlots
    });
    resetSharedRoundState(options);

    if (readyToStart) {
        options.startRoundRitual({ resetScores: false });
        return;
    }

    showWaitingState(options);
}

export function resetToStartScreen(options: ClientRoundResetOptions) {
    options.players.resetAll({
        slots: Config.player.lobbySlots
    });
    resetSharedRoundState(options);
    options.resetAmmo();
    showWaitingState(options);
    options.socket.emit('resetReady');
}

function resetSharedRoundState(options: ClientRoundResetOptions) {
    options.bullets.reset();
    options.setRoundMessage('');
    options.roundData.resetRoundFlags();
    options.timers.clearMany(RESET_TIMERS);
}

function showWaitingState(options: ClientRoundResetOptions) {
    options.setRoundState(RoundState.WAITING);
    options.syncNameEditor();
    options.renderHud();
}

export const ClientRoundResetFlow = {
    resetRound,
    resetToStartScreen
};
