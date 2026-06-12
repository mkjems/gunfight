import type { HighScoreEntry, Scenario } from '../../../shared/contracts.js';
import type { RoundState as RoundStateValue } from '../state/clientScreens.js';

type AnyFunction = (...args: any[]) => any;
type AnyModule = Record<string, any>;
type AnyDependency = any;
type ClientId = number | string;

type RuntimeSprite = {
    complete?: boolean;
    height?: number;
    onload?: (() => void) | null;
    src?: string;
    width?: number;
};

type RuntimeCanvasSurfaces = {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    hudCanvas: HTMLCanvasElement;
    hudContext: CanvasRenderingContext2D;
};

type RuntimeApp = {
    render: (state: unknown) => unknown;
};

type RuntimeInstallPrompt = {
    getProps?: () => unknown;
};

type RuntimeAssets = {
    getRockPattern: () => CanvasPattern | null;
    load: () => void;
    sprites: {
        ammo: RuntimeSprite;
        cactus: RuntimeSprite;
        saloon: RuntimeSprite;
        wagon: RuntimeSprite;
    };
};

type RuntimeUi = {
    app: RuntimeApp;
    installPrompt?: RuntimeInstallPrompt;
};

type RuntimeCamera = {
    apply: (context: CanvasRenderingContext2D) => void;
    scale: number;
    x: number;
    y: number;
};

type RuntimeCameraController = {
    getCameraScale: () => number;
    shouldUseCamera: (options: {
        camera: RuntimeCamera;
        roundState: RoundStateValue;
    }) => boolean;
    update: (options: {
        camera: RuntimeCamera;
        canvas: HTMLCanvasElement;
        player?: RuntimePlayer | null;
        roundState: RoundStateValue;
    }) => void;
    worldToHudPoint?: (options: {
        camera: RuntimeCamera;
        roundState: RoundStateValue;
        x: number;
        y: number;
    }) => {
        x: number;
        y: number;
    };
};

type RuntimeGameSounds = {
    playEmptyGun: () => void;
    playGun: () => void;
    playObstacleHit: (id?: string | null) => void;
    playPain: () => void;
    playReady: () => void;
    playRicochet: () => void;
};

type RuntimeGameLoop = {
    start: () => unknown;
};

type RuntimeScene = {
    drawAll: (context: CanvasRenderingContext2D) => void;
    moveAll: () => void;
};

type RuntimePlayer = {
    aim: unknown;
    clearDeathAnimation: () => void;
    facing: unknown;
    frame: number;
    getAim?: () => number;
    getHitBox?: () => {
        height: number;
        width: number;
        x: number;
        y: number;
    };
    playerId: ClientId;
    playDeathAnimation?: () => void;
    respondToKeyEvent?: (keyEvent: RuntimeKeyEvent) => void;
    x: number;
    y: number;
};

type RuntimePlayers = {
    all: Record<string, RuntimePlayer | undefined>;
    clearKeys: () => void;
    label: (id?: ClientId | null) => string;
    resetAll: (options: { slots: unknown }) => void;
    sync: (model: RuntimeGameModel | null, options: unknown) => void;
};

type RuntimeBullet = {
    deleteMe?: boolean;
    getHitBox: () => {
        height: number;
        width: number;
        x: number;
        y: number;
    };
    ownerId: ClientId;
    toSnapshot?: () => unknown;
};

type RuntimeBullets = {
    all: () => Record<string, RuntimeBullet | null | undefined>;
    clear: () => void;
    fire: (
        player: RuntimePlayer,
        shot?: unknown
    ) => RuntimeBullet | false | null | undefined;
    remove: (id: ClientId) => void;
    reset: () => void;
};

type RuntimeAmmo = {
    get: (clientId: ClientId) => number;
    hasAmmo: (clientId: ClientId) => boolean;
    reloadIfAllEmpty: (clients?: RuntimeClient[]) => boolean;
    reset: (clients?: RuntimeClient[]) => void;
    spend: (clientId: ClientId) => boolean;
};

type RuntimeRoundData = {
    clearHitMessage: () => void;
    clearObstacleDamage: () => void;
    clearRoundEnd: () => void;
    clearRoundPauseFlags: () => void;
    consumeAdvanceRoundAfterHit: () => boolean;
    damageObstacle: (id: string) => void;
    getHitMessage: () => { targetId: ClientId; text: string } | null;
    getObstacleDamage: (id: string) => number;
    getRoundEndsAt: () => number | null | undefined;
    getRoundMessage: () => string;
    getScenarioStartedAt: () => number | null;
    getSecondsLeft: (defaultSeconds: number) => number;
    hasMatchTimeExpired: () => boolean;
    resetRoundFlags: () => void;
    setAdvanceRoundAfterHit: (value: boolean) => void;
    setHitMessage: (message: { targetId: ClientId; text: string }) => void;
    setRoundEndsAt: (value: number) => void;
    setRoundMessage: (message?: string) => void;
    startScenario: () => void;
};

type RuntimeRoundIntro = {
    clear: () => void;
    complete: () => void;
    start: () => void;
    update: () => void;
};

type RuntimeScoreKeeper = {
    addPoint: (slot: number) => void;
    createGameResult?: (
        model: RuntimeGameModel | null,
        getClientName: (client: RuntimeClient) => string
    ) => unknown;
    getGameOverMessage: (
        clients: RuntimeClient[] | undefined,
        getClientName: (client: RuntimeClient) => string
    ) => string;
    getScore: (slot: number) => number;
    resetRecordedResult: () => void;
    resetScores: () => void;
};

type RuntimeTimers = {
    clear: (name: string) => void;
    clearMany: (names: string[]) => void;
    has: (name: string) => boolean;
    set: (name: string, callback: () => void, delay: number) => void;
};

type RuntimePositionSync = {
    applyRemote: (options: {
        data: RuntimePlayerPositionPayload;
        localPlayerId?: ClientId | null;
        players: RuntimePlayers;
        playing: boolean;
    }) => unknown;
    syncLocal: (options: {
        player?: RuntimePlayer | null;
        playing: boolean;
        socket: RuntimeSocket;
    }) => unknown;
};

type RuntimeSystems = {
    ammo: RuntimeAmmo;
    bullets: RuntimeBullets;
    highScores: HighScoreEntry[];
    localReadyRequested: boolean;
    players: RuntimePlayers;
    positionSync: RuntimePositionSync;
    roundData: RuntimeRoundData;
    roundIntro: RuntimeRoundIntro;
    roundState: RoundStateValue;
    scene: RuntimeScene;
    scoreKeeper: RuntimeScoreKeeper;
    timers: RuntimeTimers;
};

type RuntimeScenarioRenderer = {
    findBulletObstacleHit: (
        allBullets: Record<string, RuntimeBullet | null | undefined>,
        scenario?: Scenario | null
    ) => RuntimeObstacleHit | null;
    getObstacleBodies: (scenario?: Scenario | null) => unknown;
    getRockLines: (scenario?: Scenario | null) => unknown;
    render: (scenario?: Scenario | null) => void;
};

type RuntimeCollisionDebugRenderer = {
    render: (options: unknown) => void;
};

type RuntimeNameEditor = {
    close: (options?: { submit?: boolean }) => void;
    handleKeyEvent: (keyEvent: RuntimeKeyEvent) => false | unknown;
    isActive: () => boolean;
    select: (rowIndex: number, colIndex: number) => void;
    setName: (name: string) => void;
};

type RuntimeIdentity = {
    getStoredPlayerName: () => string;
    syncStoredPlayerName: (client?: RuntimeClient | null) => boolean;
};

type RuntimeInputController = {
    isDown?: (key: string) => boolean;
    press: (key: string) => void;
    ready: () => void;
    release: (key: string) => void;
    releaseReady?: () => void;
};

type RuntimeTouchControls = {
    mount: () => boolean;
    update: (state: unknown) => unknown;
};

type RuntimeSocket = {
    emit: (event: string, payload?: unknown) => void;
};

type RuntimeClient = {
    id: ClientId;
    name?: string;
    ready?: boolean;
    slot: number;
};

type RuntimeGameModel = {
    clients: RuntimeClient[];
    currentScenario?: Scenario | null;
    gameId?: string;
    message?: string;
    playerLimit?: number;
    roundNumber?: number;
    status?: string;
};

type RuntimeJoinedGamePayload = {
    model: RuntimeGameModel;
    playerId: ClientId;
};

type RuntimeKeyEvent = {
    action: string;
    key: string;
    player?: ClientId;
    shot?: unknown;
};

type RuntimePlayerPositionPayload = {
    aim: unknown;
    facing: unknown;
    frame: number;
    player: ClientId;
    x: number;
    y: number;
};

type RuntimeObstacleDamagePayload = {
    id: string;
    ownerId: ClientId;
    roundNumber?: number;
};

type RuntimeObstacleHit = {
    bullet: RuntimeBullet;
    obstacleId: string;
};

type RuntimePlayerHit = {
    bullet: RuntimeBullet;
    targetId: ClientId;
    winnerId: ClientId;
};

type RuntimeHitDetectionResult =
    | {
          type: 'matchExpired' | 'none';
      }
    | {
          hit: RuntimeObstacleHit;
          type: 'obstacleHit';
      }
    | {
          hit: RuntimePlayerHit;
          type: 'playerHit';
      };

type ClientGameRuntimeModules = {
    AmmoHudRenderer: AnyDependency;
    Camera: AnyDependency;
    CanvasTools: AnyModule;
    ClientAmmoFlow: AnyModule;
    ClientAssets: AnyDependency;
    ClientCameraController: AnyDependency;
    ClientCanvasSetup: AnyModule;
    ClientCollisionEnvironment: AnyModule;
    ClientFrameFlow: AnyModule;
    ClientGameLoop: AnyDependency;
    ClientGameSounds: AnyDependency;
    ClientGameSystems: AnyModule;
    ClientHitDetection: AnyModule;
    ClientHudFlow: AnyModule;
    ClientIdentity: AnyDependency;
    ClientInputStartup: AnyModule;
    ClientKeyEventFlow: AnyModule;
    ClientLobbyFlow: AnyModule;
    ClientLobbyHudFlow: AnyModule;
    ClientLobbyViewModel: AnyModule;
    ClientMatchTimer: AnyModule;
    ClientModelSync: AnyModule;
    ClientModelUpdateFlow: AnyModule;
    ClientNameEditorFlow: AnyModule;
    ClientNetwork: AnyDependency;
    ClientObstacleSync: AnyModule;
    ClientPlayerHitFlow: AnyModule;
    ClientRoundEndFlow: AnyModule;
    ClientRoundResetFlow: AnyModule;
    ClientRoundRitual: AnyModule;
    ClientRoundTransition: AnyModule;
    ClientScreens: AnyModule & {
        RoundState: {
            GAME_OVER: RoundStateValue;
            HIT_PAUSE: RoundStateValue;
            PLAYING: RoundStateValue;
            RITUAL: RoundStateValue;
            ROUND_OVER: RoundStateValue;
            WAITING: RoundStateValue;
        };
    };
    ClientTouchControlsFlow: AnyModule;
    ClientTouchEnvironment: AnyModule;
    Collision: AnyModule;
    CollisionDebugRenderer: AnyDependency;
    Config: AnyModule & {
        canvas: {
            height: number;
            width: number;
        };
        game: {
            seconds: number;
        };
        player: {
            defaultAim: number;
        };
    };
    KeysModel: AnyDependency;
    NameEditor: AnyDependency;
    Obstacles: AnyModule;
    requestAnimFrame: AnyFunction;
    ScenarioRenderer: AnyDependency;
    SoundEffects: AnyDependency;
    TouchControls: AnyDependency;
    ClientUi: AnyModule;
};

export type ClientGameDependencies = {
    bootstrap: {
        ClientAssets: AnyDependency;
        ClientCanvasSetup: AnyModule;
        ClientGameLoop: AnyDependency;
        ClientGameSystems: AnyModule;
        ClientInputStartup: AnyModule;
        ClientNetwork: AnyDependency;
        requestAnimFrame: AnyFunction;
    };
    environment: {
        CanvasTools: AnyModule;
        ClientCollisionEnvironment: AnyModule;
        Collision: AnyModule;
        Obstacles: AnyModule;
    };
    flow: {
        ClientAmmoFlow: AnyModule;
        ClientFrameFlow: AnyModule;
        ClientHitDetection: AnyModule;
        ClientKeyEventFlow: AnyModule;
        ClientLobbyFlow: AnyModule;
        ClientMatchTimer: AnyModule;
        ClientModelUpdateFlow: AnyModule;
        ClientNameEditorFlow: AnyModule;
        ClientObstacleSync: AnyModule;
        ClientPlayerHitFlow: AnyModule;
        ClientRoundEndFlow: AnyModule;
        ClientRoundResetFlow: AnyModule;
        ClientRoundRitual: AnyModule;
        ClientRoundTransition: AnyModule;
        ClientTouchControlsFlow: AnyModule;
    };
    model: {
        ClientLobbyViewModel: AnyModule;
        ClientModelSync: AnyModule;
        ClientScreens: ClientGameRuntimeModules['ClientScreens'];
    };
    platform: {
        Config: ClientGameRuntimeModules['Config'];
    };
    ui: {
        AmmoHudRenderer: AnyDependency;
        ClientHudFlow: AnyModule;
        ClientLobbyHudFlow: AnyModule;
        ClientUi: AnyModule;
    };
    browserConstructors: {
        Camera: AnyDependency;
        ClientCameraController: AnyDependency;
        ClientGameSounds: AnyDependency;
        ClientIdentity: AnyDependency;
        ClientTouchEnvironment: AnyModule;
        CollisionDebugRenderer: AnyDependency;
        KeysModel: AnyDependency;
        NameEditor: AnyDependency;
        ScenarioRenderer: AnyDependency;
        SoundEffects: AnyDependency;
        TouchControls: AnyDependency;
    };
};

export type ClientGameBrowser = {
    document?: Document;
    Image?: typeof globalThis.Image;
    window?: Window;
};

export type ClientGameController = {
    start: () => void;
};

export function createGame(
    groupedDependencies: ClientGameDependencies,
    browser: ClientGameBrowser = {}
): ClientGameController {
    const dependencies = flattenDependencies(groupedDependencies);
    const document = browser.document || globalThis.document;
    const window = browser.window || globalThis.window;
    const Image = browser.Image || globalThis.Image;

    return (function () {
        let canvas: HTMLCanvasElement;
        let context: CanvasRenderingContext2D;
        let hudCanvas: HTMLCanvasElement;
        let hudContext: CanvasRenderingContext2D;
        let app: RuntimeApp;
        let installPrompt: RuntimeInstallPrompt | undefined;
        let ammoHudRenderer: {
            render: (
                ammo: number,
                x: number,
                y: number,
                direction: number
            ) => void;
        };
        let assets: RuntimeAssets;
        let scenarioRenderer: RuntimeScenarioRenderer;
        let collisionDebugRenderer: RuntimeCollisionDebugRenderer;
        let identity: RuntimeIdentity;
        let nameEditor: RuntimeNameEditor;
        let cameraController: RuntimeCameraController;
        let camera: RuntimeCamera;
        let gameSounds: RuntimeGameSounds;
        let gameLoop: RuntimeGameLoop;
        let scene: RuntimeScene;
        let socket: RuntimeSocket;
        let inputController: RuntimeInputController | undefined;
        let touchControls: RuntimeTouchControls | undefined;
        let players: RuntimePlayers;
        let bullets: RuntimeBullets;
        let roundState: RoundStateValue;
        let latestModel: RuntimeGameModel | null = null;
        let highScores: HighScoreEntry[] = [];
        let scoreKeeper: RuntimeScoreKeeper;
        let roundData: RuntimeRoundData;
        let timers: RuntimeTimers;
        let positionSync: RuntimePositionSync;
        let ammo: RuntimeAmmo;
        let roundIntro: RuntimeRoundIntro;
        let localReadyRequested = false;
        let playerId: ClientId | null = null;
        const RoundState = dependencies.ClientScreens.RoundState;
        let hasStarted = false;

        function initCanvas() {
            const surfaces = dependencies.ClientCanvasSetup.create({
                CanvasTools: dependencies.CanvasTools,
                canvasConfig: dependencies.Config.canvas,
                document: document
            }) as RuntimeCanvasSurfaces;

            canvas = surfaces.canvas;
            context = surfaces.context;
            hudCanvas = surfaces.hudCanvas;
            hudContext = surfaces.hudContext;
            initAssets();
            initHudOverlay();
            initAmmoHudRenderer();
            initSoundEffects();
            initScenarioRenderer();
            initCollisionDebugRenderer();
            initIdentity();
            initNameEditor();
            initCameraController();
            initCamera();
        }

        function initNameEditor() {
            nameEditor = new dependencies.NameEditor({
                onChange: renderHud,
                onSubmit: submitNameChange
            });
        }

        function initAssets() {
            assets = new dependencies.ClientAssets({
                Image: Image,
                createRockPattern: function (image: RuntimeSprite) {
                    return dependencies.CanvasTools.createScaledPattern({
                        context: context,
                        document: document,
                        image: image
                    });
                },
                onAmmoLoaded: renderHud
            });
            assets.load();
        }

        function initHudOverlay() {
            const ui = dependencies.ClientUi.create({
                document: document,
                localStorage: window.localStorage,
                onRenderRequest: function () {
                    if (ammo) {
                        renderHud();
                    }
                },
                window: window
            }) as RuntimeUi;

            app = ui.app;
            installPrompt = ui.installPrompt;
        }

        function initAmmoHudRenderer() {
            ammoHudRenderer = new dependencies.AmmoHudRenderer({
                context: hudContext,
                sprite: assets.sprites.ammo
            });
        }

        function initCamera() {
            camera = new dependencies.Camera({
                worldWidth: dependencies.Config.canvas.width,
                worldHeight: dependencies.Config.canvas.height,
                screenWidth: dependencies.Config.canvas.width,
                screenHeight: dependencies.Config.canvas.height,
                scale: cameraController.getCameraScale()
            });
        }

        function initSoundEffects() {
            gameSounds = new dependencies.ClientGameSounds({
                soundEffects: new dependencies.SoundEffects()
            });
        }

        function initCameraController() {
            cameraController = new dependencies.ClientCameraController({
                window: window
            });
        }

        function initScenarioRenderer() {
            scenarioRenderer = new dependencies.ScenarioRenderer({
                context: context,
                getObstacleDamage: getObstacleDamage,
                getRockPattern: function () {
                    return assets.getRockPattern();
                },
                getScenarioStartedAt: function () {
                    return roundData.getScenarioStartedAt();
                },
                sprites: {
                    cactus: assets.sprites.cactus,
                    saloon: assets.sprites.saloon,
                    wagon: assets.sprites.wagon
                }
            });
        }

        function initCollisionDebugRenderer() {
            collisionDebugRenderer = new dependencies.CollisionDebugRenderer(
                context
            );
        }

        function initIdentity() {
            identity = new dependencies.ClientIdentity({
                getClientName: getClientName,
                storage: window.localStorage
            });
        }

        function initGameState() {
            const systems = dependencies.ClientGameSystems.create({
                initialRoundState: RoundState.WAITING,
                playRicochet: gameSounds.playRicochet
            }) as RuntimeSystems;

            scene = systems.scene;
            bullets = systems.bullets;
            players = systems.players;
            roundIntro = systems.roundIntro;
            roundState = systems.roundState;
            highScores = systems.highScores;
            scoreKeeper = systems.scoreKeeper;
            roundData = systems.roundData;
            timers = systems.timers;
            positionSync = systems.positionSync;
            ammo = systems.ammo;
            localReadyRequested = systems.localReadyRequested;
        }

        function initGameLoop() {
            gameLoop = new dependencies.ClientGameLoop({
                render: renderFrame,
                scheduleFrame: dependencies.requestAnimFrame,
                update: updateFrame
            });
        }

        function setRoundState(nextState: RoundStateValue) {
            roundState = dependencies.ClientRoundTransition.resolve({
                canTransition: dependencies.ClientScreens.canTransition,
                currentState: roundState,
                nextState: nextState
            });
        }

        function setRoundMessage(message: string) {
            roundData.setRoundMessage(message);
            renderHud();
        }

        function getPlayerSlot(id?: ClientId | null) {
            if (!latestModel) {
                return -1;
            }

            return latestModel.clients.findIndex(function (client) {
                return client.id === id;
            });
        }

        function getPlayer(id?: ClientId | null) {
            if (id === null || typeof id === 'undefined') {
                return undefined;
            }

            return players.all[id];
        }

        function getLocalPlayer() {
            return getPlayer(playerId);
        }

        function resetAmmo() {
            ammo.reset(latestModel?.clients);
        }

        function renderHud() {
            if (!app || !ammo || !hudCanvas || !hudContext) {
                return;
            }

            dependencies.ClientHudFlow.render({
                ammo: ammo,
                ammoHudRenderer: ammoHudRenderer,
                app: app,
                camera: camera,
                cameraController: cameraController,
                canvas: canvas,
                defaultSeconds: dependencies.Config.game.seconds,
                hudCanvas: hudCanvas,
                hudContext: hudContext,
                model: latestModel,
                players: players,
                getInstallPromptProps: getInstallPromptProps,
                getLobbyHudState: getLobbyHudState,
                getTouchControlsProps: updateTouchControls,
                roundData: roundData,
                roundState: roundState,
                scoreKeeper: scoreKeeper
            });
        }

        function getCurrentScenario() {
            return latestModel && latestModel.currentScenario;
        }

        function drawScenario() {
            scenarioRenderer.render(getCurrentScenario());
        }

        function updateBulletCollisionEnvironment() {
            dependencies.ClientCollisionEnvironment.updateBulletLines({
                scenario: getCurrentScenario(),
                scenarioRenderer: scenarioRenderer
            });
        }

        function updateMovementObstacleEnvironment() {
            dependencies.ClientCollisionEnvironment.updateObstacleBodies({
                roundState: roundState,
                scenario: getCurrentScenario(),
                scenarioRenderer: scenarioRenderer
            });
        }

        function getObstacleDamage(id: string) {
            return roundData.getObstacleDamage(id);
        }

        function damageObstacle(id: string) {
            roundData.damageObstacle(id);
        }

        function getLobbyHudState() {
            return dependencies.ClientLobbyHudFlow.getState({
                highScores: highScores,
                isTouchInterface: isTouchInterface,
                localReadyRequested: localReadyRequested,
                model: latestModel,
                nameEditor: nameEditor,
                onNameEditorSelect: function (
                    rowIndex: number,
                    colIndex: number
                ) {
                    nameEditor.select(rowIndex, colIndex);
                    renderHud();
                },
                playerId: playerId,
                roundState: roundState
            });
        }

        function getInstallPromptProps() {
            return installPrompt && installPrompt.getProps
                ? installPrompt.getProps()
                : undefined;
        }

        function shouldShowHighScoresScreen() {
            return dependencies.ClientLobbyViewModel.shouldShowHighScoresScreen(
                {
                    localReadyRequested: localReadyRequested,
                    model: latestModel
                }
            );
        }

        function isTouchInterface() {
            return dependencies.ClientTouchEnvironment.isTouchInterface(window);
        }

        function shouldUseCamera() {
            return cameraController.shouldUseCamera({
                camera: camera,
                roundState: roundState
            });
        }

        function updateCamera() {
            cameraController.update({
                camera: camera,
                canvas: canvas,
                player: getLocalPlayer(),
                roundState: roundState
            });
        }

        function shouldShowLobbyPrompt() {
            return dependencies.ClientLobbyViewModel.shouldShowLobbyPrompt({
                localReadyRequested: localReadyRequested,
                model: latestModel,
                playerId: playerId
            });
        }

        function isLocalClientReady() {
            return dependencies.ClientLobbyViewModel.isLocalClientReady({
                localReadyRequested: localReadyRequested,
                model: latestModel,
                playerId: playerId
            });
        }

        function isLocalClientWaiting() {
            return dependencies.ClientLobbyViewModel.isLocalClientWaiting({
                localReadyRequested: localReadyRequested,
                model: latestModel,
                playerId: playerId
            });
        }

        function getLocalClient() {
            return dependencies.ClientLobbyViewModel.getLocalClient(
                latestModel,
                playerId
            );
        }

        function getClientName(client: RuntimeClient) {
            return dependencies.ClientLobbyViewModel.getClientName(client);
        }

        function getStoredPlayerName() {
            return identity.getStoredPlayerName();
        }

        function submitNameChange(name: string) {
            dependencies.ClientNameEditorFlow.submitNameChange({
                name: name,
                socket: socket
            });
        }

        function syncNameEditor() {
            dependencies.ClientNameEditorFlow.sync({
                client: getLocalClient(),
                identity: identity,
                editor: nameEditor
            });
        }

        function closeNameEditor() {
            dependencies.ClientNameEditorFlow.close(nameEditor);
        }

        function enterLobbyState() {
            dependencies.ClientLobbyFlow.enter({
                bullets: bullets,
                players: players,
                roundData: roundData,
                roundIntro: roundIntro,
                scoreKeeper: scoreKeeper,
                setRoundState: setRoundState,
                syncNameEditor: syncNameEditor,
                timers: timers
            });
        }

        function syncPlayers(model: RuntimeGameModel) {
            const previousModel = latestModel;

            latestModel = model;

            dependencies.ClientModelUpdateFlow.sync({
                clearAbandonedRequeue: clearAbandonedRequeue,
                clearLocalReadyRequest: function () {
                    localReadyRequested = false;
                },
                enterLobbyState: enterLobbyState,
                model: model,
                playerId: playerId,
                players: players,
                playReadySound: gameSounds.playReady,
                previousModel: previousModel,
                renderHud: renderHud,
                roundState: roundState,
                scheduleAbandonedRequeue: scheduleAbandonedRequeue,
                startRoundRitual: startRoundRitual,
                syncNameEditor: syncNameEditor,
                syncStoredPlayerName: syncStoredPlayerName
            });
        }

        function scheduleAbandonedRequeue() {
            dependencies.ClientLobbyFlow.scheduleAbandonedRequeue({
                socket: socket,
                timers: timers
            });
        }

        function clearAbandonedRequeue() {
            dependencies.ClientLobbyFlow.clearAbandonedRequeue({
                timers: timers
            });
        }

        function syncStoredPlayerName() {
            identity.syncStoredPlayerName(getLocalClient());
        }

        function startRoundRitual(options?: { resetScores?: boolean }) {
            options = options || {};

            dependencies.ClientRoundRitual.start({
                bullets: bullets,
                closeNameEditor: closeNameEditor,
                endGame: endGame,
                hasMatchTimeExpired: roundData.hasMatchTimeExpired,
                renderHud: renderHud,
                resetAmmo: resetAmmo,
                resetScores: options.resetScores,
                roundData: roundData,
                roundIntro: roundIntro,
                scheduleMatchEnd: scheduleMatchEnd,
                scoreKeeper: scoreKeeper,
                setRoundMessage: setRoundMessage,
                setRoundState: setRoundState,
                timers: timers
            });
        }

        function scheduleMatchEnd() {
            dependencies.ClientMatchTimer.scheduleEnd({
                endGame: endGame,
                roundData: roundData,
                timers: timers
            });
        }

        function handleKeyEvent(keyEvent: RuntimeKeyEvent) {
            return dependencies.ClientKeyEventFlow.handle({
                ammo: ammo,
                bullets: bullets,
                isLocalClientWaiting: isLocalClientWaiting,
                keyEvent: keyEvent,
                nameEditor: nameEditor,
                onGunFired: gameSounds.playGun,
                onBulletFired: function () {
                    reloadIfBothPlayersAreOutOfAmmo();
                    renderHud();
                },
                onEmptyGun: gameSounds.playEmptyGun,
                player: getPlayer(keyEvent.player),
                playerId: playerId,
                renderHud: renderHud,
                roundState: roundState
            });
        }

        function reloadIfBothPlayersAreOutOfAmmo() {
            dependencies.ClientAmmoFlow.reloadIfBothPlayersAreOut({
                ammo: ammo,
                model: latestModel,
                roundState: roundState
            });
        }

        function checkForHits() {
            const result = dependencies.ClientHitDetection.check({
                bullets: bullets,
                collision: dependencies.Collision,
                findBulletObstacleHit: findBulletObstacleHit,
                matchTimeExpired: roundData.hasMatchTimeExpired(),
                players: players,
                roundState: roundState
            }) as RuntimeHitDetectionResult;

            if (result.type === 'matchExpired') {
                endGame();
                return;
            }

            if (result.type === 'obstacleHit') {
                handleObstacleHit(result.hit);
                return;
            }

            if (result.type === 'playerHit') {
                handlePlayerHit(result.hit);
            }
        }

        function findBulletObstacleHit() {
            return scenarioRenderer.findBulletObstacleHit(
                bullets.all(),
                getCurrentScenario()
            );
        }

        function handleObstacleHit(hit: RuntimeObstacleHit) {
            dependencies.ClientObstacleSync.handleLocalHit({
                applyDamage: applyObstacleDamage,
                hit: hit,
                model: latestModel,
                playerId: playerId,
                socket: socket
            });
        }

        function applyObstacleDamage(data: RuntimeObstacleDamagePayload) {
            dependencies.ClientObstacleSync.applyDamage({
                bullets: bullets,
                damageObstacle: damageObstacle,
                data: data,
                model: latestModel,
                playObstacleHit: gameSounds.playObstacleHit
            });
        }

        function handlePlayerHit(hit: RuntimePlayerHit) {
            dependencies.ClientPlayerHitFlow.handleHit({
                bullets: bullets,
                hit: hit,
                playerId: playerId,
                players: players,
                playPain: gameSounds.playPain,
                renderHud: renderHud,
                resetAfterHit: resetAfterHit,
                roundData: roundData,
                scoreKeeper: scoreKeeper,
                setRoundState: setRoundState,
                timers: timers,
                winnerSlot: getPlayerSlot(hit.winnerId)
            });
        }

        function resetAfterHit() {
            dependencies.ClientPlayerHitFlow.resetAfterHit({
                bullets: bullets,
                endGame: endGame,
                hasMatchTimeExpired: roundData.hasMatchTimeExpired,
                players: players,
                resetAmmo: resetAmmo,
                roundData: roundData,
                socket: socket,
                startRoundRitual: startRoundRitual
            });
        }

        function endRound(winnerId?: ClientId | null) {
            dependencies.ClientRoundEndFlow.endRound({
                bullets: bullets,
                closeNameEditor: closeNameEditor,
                getPlayerSlot: getPlayerSlot,
                players: players,
                renderHud: renderHud,
                resetRound: resetRound,
                roundData: roundData,
                roundIntro: roundIntro,
                scoreKeeper: scoreKeeper,
                setRoundMessage: setRoundMessage,
                setRoundState: setRoundState,
                timers: timers,
                winnerId: winnerId
            });
        }

        function endGame() {
            dependencies.ClientRoundEndFlow.endGame({
                bullets: bullets,
                closeNameEditor: closeNameEditor,
                getClientName: getClientName,
                model: latestModel,
                players: players,
                renderHud: renderHud,
                resetToStartScreen: resetToStartScreen,
                roundData: roundData,
                roundIntro: roundIntro,
                scoreKeeper: scoreKeeper,
                setRoundMessage: setRoundMessage,
                setRoundState: setRoundState,
                socket: socket,
                timers: timers
            });
        }

        function resetRound() {
            dependencies.ClientRoundResetFlow.resetRound({
                bullets: bullets,
                isReadyToStart: dependencies.ClientModelSync.isReadyToStart,
                model: latestModel,
                players: players,
                renderHud: renderHud,
                roundData: roundData,
                setRoundMessage: setRoundMessage,
                setRoundState: setRoundState,
                startRoundRitual: startRoundRitual,
                syncNameEditor: syncNameEditor,
                timers: timers
            });
        }

        function resetToStartScreen() {
            dependencies.ClientRoundResetFlow.resetToStartScreen({
                bullets: bullets,
                players: players,
                renderHud: renderHud,
                resetAmmo: resetAmmo,
                roundData: roundData,
                setRoundMessage: setRoundMessage,
                setRoundState: setRoundState,
                socket: socket,
                syncNameEditor: syncNameEditor,
                timers: timers
            });
        }

        function updateFrame() {
            dependencies.ClientFrameFlow.update({
                checkForHits: checkForHits,
                roundIntro: roundIntro,
                scene: scene,
                syncLocalPlayerPosition: syncLocalPlayerPosition,
                updateBulletCollisionEnvironment:
                    updateBulletCollisionEnvironment,
                updateCamera: updateCamera,
                updateMovementObstacleEnvironment:
                    updateMovementObstacleEnvironment
            });
        }

        function renderFrame() {
            dependencies.ClientFrameFlow.render({
                camera: camera,
                canvas: canvas,
                context: context,
                drawCollisionBodies: drawCollisionBodies,
                drawScenario: drawScenario,
                renderHud: renderHud,
                roundState: roundState,
                scene: scene,
                shouldUseCamera: shouldUseCamera,
                updateTouchControls: updateTouchControls
            });
        }

        function syncLocalPlayerPosition() {
            positionSync.syncLocal({
                playing: roundState === RoundState.PLAYING,
                player: getLocalPlayer(),
                socket: socket
            });
        }

        function applyRemotePlayerPosition(data: RuntimePlayerPositionPayload) {
            positionSync.applyRemote({
                data: data,
                localPlayerId: playerId,
                players: players,
                playing: roundState === RoundState.PLAYING
            });
        }

        function initTouchControls() {
            touchControls = new dependencies.TouchControls({
                input: inputController,
                getAimLevel: getLocalAimLevel
            });
            updateTouchControls();
        }

        function getLocalAimLevel() {
            return dependencies.ClientTouchControlsFlow.getLocalAimLevel({
                defaultAim: dependencies.Config.player.defaultAim,
                player: getLocalPlayer()
            });
        }

        function updateTouchControls() {
            return dependencies.ClientTouchControlsFlow.update({
                aimLevel: getLocalAimLevel(),
                editing: nameEditor && nameEditor.isActive(),
                highScoresVisible: shouldShowHighScoresScreen(),
                ready: isLocalClientReady(),
                roundState: roundState,
                touchControls: touchControls
            });
        }

        function drawCollisionBodies() {
            collisionDebugRenderer.render({
                obstacleBodies: dependencies.Obstacles.all(),
                players: players.all
            });
        }

        function start() {
            initCanvas();
            initGameState();

            socket = new dependencies.ClientNetwork({
                getStoredPlayerName: getStoredPlayerName,
                onHighScores: function (nextHighScores: unknown) {
                    highScores = Array.isArray(nextHighScores)
                        ? (nextHighScores as HighScoreEntry[])
                        : [];
                    renderHud();
                },
                onJoinedGame: function (data: RuntimeJoinedGamePayload) {
                    playerId = data.playerId;
                    syncPlayers(data.model);
                    startInputAndAnimation();
                },
                onKeyEvent: handleKeyEvent,
                onPlayerPosition: applyRemotePlayerPosition,
                onObstacleDamage: applyObstacleDamage,
                onModelUpdate: syncPlayers
            }).socket;
        }

        function startOnce() {
            if (hasStarted) {
                return;
            }

            hasStarted = true;
            start();
        }

        function startInputAndAnimation() {
            inputController = dependencies.ClientInputStartup.start({
                createInputController: function () {
                    return new dependencies.KeysModel(
                        socket,
                        playerId,
                        handleKeyEvent,
                        {
                            canReady: function () {
                                return !nameEditor || !nameEditor.isActive();
                            },
                            onReady: function () {
                                localReadyRequested = true;
                                renderHud();
                            }
                        }
                    );
                },
                initTouchControls: function (
                    nextInputController: RuntimeInputController
                ) {
                    inputController = nextInputController;
                    initTouchControls();
                },
                inputController: inputController,
                startGameLoop: function () {
                    initGameLoop();
                    gameLoop.start();
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startOnce);
        } else {
            startOnce();
        }

        return {
            start: startOnce
        };
    })();
}

function flattenDependencies(
    dependencies: ClientGameDependencies
): ClientGameRuntimeModules {
    return {
        ...dependencies.bootstrap,
        ...dependencies.environment,
        ...dependencies.flow,
        ...dependencies.model,
        ...dependencies.platform,
        ...dependencies.ui,
        ...dependencies.browserConstructors
    };
}
