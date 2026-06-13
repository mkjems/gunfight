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
        name?: string;
    }>;
};

type GameHudAmmoDisplay = {
    count: number;
    side: 'left' | 'right';
};

type ClientHudFlowOptions = {
    ammo: {
        get: (clientId: ClientId) => number;
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
    particleCanvas?: ElementLike | null;
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
    show(options.particleCanvas, true);
    show(options.hudCanvas, true);
    options.app.render({
        activeScreen: Screen.GAME,
        gameHud: getGameHudState(options),
        installPrompt: options.getInstallPromptProps?.(),
        touchControls: options.getTouchControlsProps?.()
    });
}

function renderLobbyApp(options: ClientHudFlowOptions) {
    const lobbyState = options.getLobbyHudState();

    show(options.canvas, lobbyState.canvasVisible);
    show(options.particleCanvas, lobbyState.canvasVisible);
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
    const firstClient = options.model?.clients?.[0];
    const secondClient = options.model?.clients?.[1];

    return {
        ...gameHudViewModel.getState({
            camera: options.camera as never,
            cameraController: options.cameraController as never,
            defaultSeconds: options.defaultSeconds,
            players: options.players as never,
            roundData: options.roundData as never,
            roundState: options.roundState,
            scoreKeeper: options.scoreKeeper as never
        }),
        ammoDisplays: getAmmoDisplays(options, firstClient, secondClient),
        leftName: getClientName(firstClient, 0),
        rightName: getClientName(secondClient, 1)
    };
}

function getAmmoDisplays(
    options: ClientHudFlowOptions,
    firstClient?: { id: ClientId },
    secondClient?: { id: ClientId }
): GameHudAmmoDisplay[] {
    if (!firstClient || !secondClient) {
        return [];
    }

    return [
        {
            count: options.ammo.get(firstClient.id),
            side: 'left'
        },
        {
            count: options.ammo.get(secondClient.id),
            side: 'right'
        }
    ];
}

function getClientName(client: { name?: string } | undefined, slot: number) {
    if (client && client.name) {
        return client.name;
    }

    if (client) {
        return 'PLAYER ' + (slot + 1);
    }

    return '';
}

function show(element: ElementLike | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}

export const ClientHudFlow = {
    getAmmoDisplays,
    getGameHudState,
    render
};
