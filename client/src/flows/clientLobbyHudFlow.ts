import { getActiveScreen, Screen } from '../state/clientScreens.js';
import {
    getLobbyViewModel,
    shouldShowHighScoresScreen,
    shouldShowLobbyPrompt
} from '../ui/viewModels/clientLobbyViewModel.js';

type LobbyHudFlowOptions = {
    highScores?: unknown[];
    isTouchInterface: () => boolean;
    localReadyRequested?: boolean;
    model?: Parameters<typeof getLobbyViewModel>[0]['model'];
    nameEditor?: {
        getState: () => unknown;
        isActive: () => boolean;
    } | null;
    now?: number;
    onNameEditorSelect: (rowIndex: number, colIndex: number) => void;
    playerId?: Parameters<typeof getLobbyViewModel>[0]['playerId'];
    roundState: Parameters<typeof getActiveScreen>[0]['roundState'];
};

export type LobbyHudState = {
    activeScreen: Screen;
    canvasVisible: boolean;
    highScores?: {
        playPrompt: string;
        rows: unknown[];
    };
    hudCanvasVisible: boolean;
    lobby?: unknown;
    nameEditor?: {
        helpLines: string[];
        onSelect: (rowIndex: number, colIndex: number) => void;
        state: unknown;
    };
};

export function getState(options: LobbyHudFlowOptions): LobbyHudState {
    const isTouch = options.isTouchInterface();
    const activeScreen = getActiveScreenForOptions(options);

    if (activeScreen === Screen.LOBBY_EDIT_NAME) {
        return {
            activeScreen,
            canvasVisible: false,
            hudCanvasVisible: false,
            nameEditor: {
                state: options.nameEditor?.getState(),
                helpLines: isTouch
                    ? []
                    : ['H J K L MOVE', 'SPACE SELECT', 'E DONE'],
                onSelect: options.onNameEditorSelect
            }
        };
    }

    if (activeScreen === Screen.HIGH_SCORES) {
        return {
            activeScreen,
            canvasVisible: false,
            highScores: getHighScoresState(options, isTouch),
            hudCanvasVisible: false
        };
    }

    return {
        activeScreen,
        canvasVisible: true,
        hudCanvasVisible: true,
        lobby: getLobbyViewModel({
            isTouch,
            localReadyRequested: options.localReadyRequested,
            model: options.model,
            playerId: options.playerId
        })
    };
}

function getActiveScreenForOptions(options: LobbyHudFlowOptions) {
    return getActiveScreen({
        roundState: options.roundState,
        nameEditorActive: !!(
            options.nameEditor && options.nameEditor.isActive()
        ),
        highScoresVisible: shouldShowHighScoresScreenForOptions(options)
    });
}

function shouldShowHighScoresScreenForOptions(options: LobbyHudFlowOptions) {
    return shouldShowHighScoresScreen({
        localReadyRequested: options.localReadyRequested,
        model: options.model,
        now: options.now
    });
}

function getHighScoresState(options: LobbyHudFlowOptions, isTouch: boolean) {
    return {
        rows:
            options.highScores && options.highScores.length
                ? options.highScores
                : [],
        playPrompt:
            shouldShowLobbyPromptForOptions(options) && !isTouch
                ? 'PRESS P TO PLAY'
                : ''
    };
}

function shouldShowLobbyPromptForOptions(options: LobbyHudFlowOptions) {
    return shouldShowLobbyPrompt({
        localReadyRequested: options.localReadyRequested,
        model: options.model,
        playerId: options.playerId
    });
}

export const ClientLobbyHudFlow = {
    getState
};
