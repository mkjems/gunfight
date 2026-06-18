import { getActiveScreen, Screen } from '../state/clientScreens.js';
import {
    getLobbyViewModel,
    shouldShowHighScoresScreen
} from '../ui/viewModels/clientLobbyViewModel.js';

type LobbyHudFlowOptions = {
    highScores?: unknown[];
    highScoresVisible?: boolean;
    isTouchInterface: () => boolean;
    localReadyRequested?: boolean;
    model?: Parameters<typeof getLobbyViewModel>[0]['model'];
    nameEditor?: {
        getState: () => unknown;
        isActive: () => boolean;
    } | null;
    onNameEditorSelect: (rowIndex: number, colIndex: number) => void;
    playerId?: Parameters<typeof getLobbyViewModel>[0]['playerId'];
    previousResult?: unknown;
    players?: Parameters<typeof getLobbyViewModel>[0]['players'];
    duelState: Parameters<typeof getActiveScreen>[0]['duelState'];
};

export type LobbyHudState = {
    activeScreen: Screen;
    canvasVisible: boolean;
    highScores?: {
        playPrompt: string;
        rowLimit: number;
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
                    : ['H J K L MOVE', 'SPACE SELECT', 'E BACK TO LOBBY'],
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

    const lobby = getLobbyViewModel({
        isTouch,
        localReadyRequested: options.localReadyRequested,
        model: options.model,
        playerId: options.playerId,
        players: options.players
    });

    return {
        activeScreen,
        canvasVisible: true,
        hudCanvasVisible: true,
        lobby: {
            ...lobby,
            ...(isTouch || !options.previousResult
                ? {}
                : { previousResult: options.previousResult })
        }
    };
}

function getActiveScreenForOptions(options: LobbyHudFlowOptions) {
    return getActiveScreen({
        duelState: options.duelState,
        nameEditorActive: !!(
            options.nameEditor && options.nameEditor.isActive()
        ),
        highScoresVisible: shouldShowHighScoresScreenForOptions(options)
    });
}

function shouldShowHighScoresScreenForOptions(options: LobbyHudFlowOptions) {
    return shouldShowHighScoresScreen({
        highScoresVisible: options.highScoresVisible,
        localReadyRequested: options.localReadyRequested,
        model: options.model,
        playerId: options.playerId
    });
}

function getHighScoresState(options: LobbyHudFlowOptions, isTouch: boolean) {
    return {
        backPrompt: isTouch ? '' : 'PRESS S TO RETURN TO LOBBY',
        rowLimit: isTouch ? 5 : 10,
        rows:
            options.highScores && options.highScores.length
                ? options.highScores
                : [],
        playPrompt: ''
    };
}

export const ClientLobbyHudFlow = {
    getState
};
