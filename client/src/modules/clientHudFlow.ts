import { RoundState } from './clientScreens.js';
import { getState } from './gameHudViewModel.js';

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
    camera: unknown;
    cameraController: unknown;
    canvas?: ElementLike | null;
    defaultSeconds: number;
    gameHud?: ElementLike | null;
    gameHudScreen: {
        render: (state: unknown) => void;
    };
    gameHudViewModel?: {
        getState: typeof getState;
    };
    hudCanvas: HudCanvas;
    hudContext: HudContext;
    lobbyHud?: ElementLike | null;
    model?: GameModel | null;
    players: unknown;
    renderLobbyHud: () => void;
    roundData: unknown;
    roundState: RoundState;
    scoreKeeper: unknown;
    updateTouchControls: () => void;
};

export function render(options: ClientHudFlowOptions) {
    options.hudContext.clearRect(
        0,
        0,
        options.hudCanvas.width,
        options.hudCanvas.height
    );

    if (options.roundState === RoundState.WAITING) {
        options.renderLobbyHud();
        options.updateTouchControls();
        return;
    }

    show(options.canvas, true);
    show(options.hudCanvas, true);
    show(options.gameHud, true);
    show(options.lobbyHud, false);

    const firstClient = options.model && options.model.clients?.[0];
    const secondClient = options.model && options.model.clients?.[1];

    renderGameHud(options);

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
    options.updateTouchControls();
}

export function renderGameHud(options: ClientHudFlowOptions) {
    const gameHudViewModel = options.gameHudViewModel || { getState };

    options.gameHudScreen.render(
        gameHudViewModel.getState({
            camera: options.camera as never,
            cameraController: options.cameraController as never,
            defaultSeconds: options.defaultSeconds,
            players: options.players as never,
            roundData: options.roundData as never,
            roundState: options.roundState,
            scoreKeeper: options.scoreKeeper as never
        })
    );
}

function show(element: ElementLike | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}

export const ClientHudFlow = {
    render,
    renderGameHud
};
