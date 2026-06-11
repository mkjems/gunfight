import { getActiveScreen, Screen } from './clientScreens.js';
import {
    getLobbyViewModel,
    shouldShowHighScoresScreen,
    shouldShowLobbyPrompt
} from './clientLobbyViewModel.js';

type ElementLike = {
    hidden?: boolean;
};

type LobbyHudFlowOptions = {
    canvas?: ElementLike | null;
    gameHud?: ElementLike | null;
    highScores?: unknown[];
    highScoresScreen: {
        render: (options: { playPrompt: string; rows: unknown[] }) => void;
    };
    hudCanvas?: ElementLike | null;
    isTouchInterface: () => boolean;
    lobbyHud?: ElementLike | null;
    lobbyScreen: {
        clear: () => void;
        render: (viewModel: unknown) => void;
    };
    localReadyRequested?: boolean;
    model?: Parameters<typeof getLobbyViewModel>[0]['model'];
    nameEditor?: {
        getState: () => unknown;
        isActive: () => boolean;
    } | null;
    nameEditorScreen: {
        hide: () => void;
        render: (options: {
            helpLines: string[];
            onSelect: (rowIndex: number, colIndex: number) => void;
            state: unknown;
        }) => void;
    };
    now?: number;
    onNameEditorSelect: (rowIndex: number, colIndex: number) => void;
    playerId?: Parameters<typeof getLobbyViewModel>[0]['playerId'];
    roundState: Parameters<typeof getActiveScreen>[0]['roundState'];
};

export function render(options: LobbyHudFlowOptions) {
    const isTouch = options.isTouchInterface();
    const activeScreen = getActiveScreenForOptions(options);

    show(options.gameHud, false);
    show(options.lobbyHud, true);

    if (activeScreen === Screen.LOBBY_EDIT_NAME) {
        renderNameEditor(options, isTouch);
        return activeScreen;
    }

    show(options.canvas, true);
    show(options.hudCanvas, true);
    options.nameEditorScreen.hide();

    if (activeScreen === Screen.HIGH_SCORES) {
        renderHighScoresScreen(options, isTouch);
        return activeScreen;
    }

    options.lobbyScreen.render(
        getLobbyViewModel({
            isTouch,
            localReadyRequested: options.localReadyRequested,
            model: options.model,
            playerId: options.playerId
        })
    );

    return activeScreen;
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

function renderHighScoresScreen(
    options: LobbyHudFlowOptions,
    isTouch: boolean
) {
    options.highScoresScreen.render({
        rows:
            options.highScores && options.highScores.length
                ? options.highScores
                : [],
        playPrompt:
            shouldShowLobbyPromptForOptions(options) && !isTouch
                ? 'PRESS P TO PLAY'
                : ''
    });
}

function shouldShowLobbyPromptForOptions(options: LobbyHudFlowOptions) {
    return shouldShowLobbyPrompt({
        localReadyRequested: options.localReadyRequested,
        model: options.model,
        playerId: options.playerId
    });
}

function renderNameEditor(options: LobbyHudFlowOptions, isTouch: boolean) {
    show(options.canvas, false);
    show(options.hudCanvas, false);
    options.lobbyScreen.clear();
    options.nameEditorScreen.render({
        state: options.nameEditor?.getState(),
        helpLines: isTouch ? [] : ['H J K L MOVE', 'SPACE SELECT', 'E DONE'],
        onSelect: options.onNameEditorSelect
    });
}

function show(element: ElementLike | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}

export const ClientLobbyHudFlow = {
    render
};
