import { RoundState, Screen } from '../state/clientScreens.js';
import { getState } from '../ui/viewModels/gameHudViewModel.js';

type ClientId = number | string;

type ElementLike = {
    hidden?: boolean;
};

type HudCanvas = ElementLike & {
    height: number;
    width: number;
};

type HudContext = {
    clearRect: (x: number, y: number, width: number, height: number) => void;
};

type GameModel = {
    clients?: Array<{
        id: ClientId;
    }>;
};

type ClientHudFlowOptions = {
    ammo: {
        get: (clientId: ClientId) => number;
    };
    ammoHudRenderer: {
        render: (ammo: number, x: number, y: number, direction: number) => void;
    };
    app: {
        render: (state: unknown) => void;
    };
    camera: unknown;
    cameraController: unknown;
    canvas?: ElementLike | null;
    defaultSeconds: number;
    gameHudViewModel?: {
        getState: typeof getState;
    };
    getInstallPromptProps?: () => unknown;
    getLobbyHudState: () => {
        activeScreen: Screen;
        canvasVisible: boolean;
        highScores?: unknown;
        hudCanvasVisible: boolean;
        lobby?: unknown;
        nameEditor?: unknown;
    };
    getTouchControlsProps?: () => unknown;
    hudCanvas: HudCanvas;
    hudContext: HudContext;
    model?: GameModel | null;
    players: unknown;
    roundData: unknown;
    roundState: RoundState;
    scoreKeeper: unknown;
};

export function render(options: ClientHudFlowOptions) {
    options.hudContext.clearRect(
        0,
        0,
        options.hudCanvas.width,
        options.hudCanvas.height
    );

    if (options.roundState === RoundState.WAITING) {
        renderLobbyApp(options);
        return;
    }

    show(options.canvas, true);
    show(options.hudCanvas, true);
    options.app.render({
        activeScreen: Screen.GAME,
        gameHud: getGameHudState(options),
        installPrompt: options.getInstallPromptProps?.(),
        touchControls: options.getTouchControlsProps?.()
    });

    const firstClient = options.model && options.model.clients?.[0];
    const secondClient = options.model && options.model.clients?.[1];

    if (!firstClient || !secondClient) {
        return;
    }

    options.ammoHudRenderer.render(
        options.ammo.get(firstClient.id),
        122,
        606,
        1
    );
    options.ammoHudRenderer.render(
        options.ammo.get(secondClient.id),
        828,
        606,
        -1
    );
}

function renderLobbyApp(options: ClientHudFlowOptions) {
    const lobbyState = options.getLobbyHudState();

    show(options.canvas, lobbyState.canvasVisible);
    show(options.hudCanvas, lobbyState.hudCanvasVisible);
    options.app.render({
        activeScreen: lobbyState.activeScreen,
        highScores: lobbyState.highScores,
        installPrompt: options.getInstallPromptProps?.(),
        lobby: lobbyState.lobby,
        nameEditor: lobbyState.nameEditor,
        touchControls: options.getTouchControlsProps?.()
    });
}

export function getGameHudState(options: ClientHudFlowOptions) {
    const gameHudViewModel = options.gameHudViewModel || { getState };

    return gameHudViewModel.getState({
        camera: options.camera as never,
        cameraController: options.cameraController as never,
        defaultSeconds: options.defaultSeconds,
        players: options.players as never,
        roundData: options.roundData as never,
        roundState: options.roundState,
        scoreKeeper: options.scoreKeeper as never
    });
}

function show(element: ElementLike | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}

export const ClientHudFlow = {
    getGameHudState,
    render
};
