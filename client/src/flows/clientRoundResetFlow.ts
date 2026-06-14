import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';

type ReadyModel = {
    clients: Array<{
        id: string | number;
        ready?: boolean;
    }>;
    currentScenario?: {
        playerStarts?: typeof Config.player.slots;
    } | null;
};

type ClientRoundResetOptions = {
    bullets: {
        reset: () => void;
    };
    isReadyToStart: (model?: ReadyModel | null) => boolean;
    model?: ReadyModel | null;
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
    startRoundRitual: (options: { resetScores: boolean }) => void;
    syncNameEditor: () => void;
    timers: {
        clearMany: (names: string[]) => void;
    };
};

type ResetToStartScreenOptions = Omit<
    ClientRoundResetOptions,
    'isReadyToStart' | 'model' | 'startRoundRitual'
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
    const readyToStart = options.isReadyToStart(options.model);

    options.players.resetAll({
        slots: readyToStart
            ? getScenarioPlayerStarts(options.model)
            : Config.player.lobbySlots
    });
    resetSharedRoundState(options);

    if (readyToStart) {
        options.startRoundRitual({ resetScores: false });
        return;
    }

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

function getScenarioPlayerStarts(model?: ReadyModel | null) {
    const starts =
        model && model.currentScenario && model.currentScenario.playerStarts;

    return starts && starts.length >= 2 ? starts : Config.player.slots;
}

export const ClientRoundResetFlow = {
    resetRound,
    resetToStartScreen
};
