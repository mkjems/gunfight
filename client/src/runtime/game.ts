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

type ClientGameRuntimeOptions = {
    dependencies: ClientGameRuntimeModules;
    document: Document;
    ImageCtor: typeof globalThis.Image;
    window: Window;
};

export function createGame(
    groupedDependencies: ClientGameDependencies,
    browser: ClientGameBrowser = {}
): ClientGameController {
    const dependencies = flattenDependencies(groupedDependencies);
    const runtime = new ClientGameRuntime({
        dependencies,
        document: browser.document || globalThis.document,
        ImageCtor: browser.Image || globalThis.Image,
        window: browser.window || globalThis.window
    });

    runtime.connectStartLifecycle();

    return runtime;
}

class ClientGameRuntime implements ClientGameController {
    private readonly dependencies: ClientGameRuntimeModules;
    private readonly document: Document;
    private readonly ImageCtor: typeof globalThis.Image;
    private readonly window: Window;
    private readonly RoundState: ClientGameRuntimeModules['ClientScreens']['RoundState'];

    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private hudCanvas!: HTMLCanvasElement;
    private hudContext!: CanvasRenderingContext2D;
    private app!: RuntimeApp;
    private installPrompt?: RuntimeInstallPrompt;
    private ammoHudRenderer!: {
        render: (ammo: number, x: number, y: number, direction: number) => void;
    };
    private assets!: RuntimeAssets;
    private scenarioRenderer!: RuntimeScenarioRenderer;
    private collisionDebugRenderer!: RuntimeCollisionDebugRenderer;
    private identity!: RuntimeIdentity;
    private nameEditor!: RuntimeNameEditor;
    private cameraController!: RuntimeCameraController;
    private camera!: RuntimeCamera;
    private gameSounds!: RuntimeGameSounds;
    private gameLoop!: RuntimeGameLoop;
    private scene!: RuntimeScene;
    private socket!: RuntimeSocket;
    private inputController?: RuntimeInputController;
    private touchControls?: RuntimeTouchControls;
    private players!: RuntimePlayers;
    private bullets!: RuntimeBullets;
    private roundState!: RoundStateValue;
    private latestModel: RuntimeGameModel | null = null;
    private highScores: HighScoreEntry[] = [];
    private scoreKeeper!: RuntimeScoreKeeper;
    private roundData!: RuntimeRoundData;
    private timers!: RuntimeTimers;
    private positionSync!: RuntimePositionSync;
    private ammo!: RuntimeAmmo;
    private roundIntro!: RuntimeRoundIntro;
    private localReadyRequested = false;
    private playerId: ClientId | null = null;
    private hasStarted = false;

    constructor(options: ClientGameRuntimeOptions) {
        this.dependencies = options.dependencies;
        this.document = options.document;
        this.ImageCtor = options.ImageCtor;
        this.window = options.window;
        this.RoundState = options.dependencies.ClientScreens.RoundState;
    }

    connectStartLifecycle() {
        if (this.document.readyState === 'loading') {
            this.document.addEventListener('DOMContentLoaded', () =>
                this.startOnce()
            );
            return;
        }

        this.startOnce();
    }

    start = () => {
        this.startOnce();
    };

    private startOnce = () => {
        if (this.hasStarted) {
            return;
        }

        this.hasStarted = true;
        this.startRuntime();
    };

    private startRuntime = () => {
        this.initCanvas();
        this.initGameState();

        this.socket = new this.dependencies.ClientNetwork({
            getStoredPlayerName: this.getStoredPlayerName,
            onHighScores: this.onHighScores,
            onJoinedGame: this.onJoinedGame,
            onKeyEvent: this.handleKeyEvent,
            onPlayerPosition: this.applyRemotePlayerPosition,
            onObstacleDamage: this.applyObstacleDamage,
            onModelUpdate: this.syncPlayers
        }).socket;
    };

    private initCanvas = () => {
        const surfaces = this.dependencies.ClientCanvasSetup.create({
            CanvasTools: this.dependencies.CanvasTools,
            canvasConfig: this.dependencies.Config.canvas,
            document: this.document
        }) as RuntimeCanvasSurfaces;

        this.canvas = surfaces.canvas;
        this.context = surfaces.context;
        this.hudCanvas = surfaces.hudCanvas;
        this.hudContext = surfaces.hudContext;
        this.initAssets();
        this.initHudOverlay();
        this.initAmmoHudRenderer();
        this.initSoundEffects();
        this.initScenarioRenderer();
        this.initCollisionDebugRenderer();
        this.initIdentity();
        this.initNameEditor();
        this.initCameraController();
        this.initCamera();
    };

    private initAssets = () => {
        this.assets = new this.dependencies.ClientAssets({
            Image: this.ImageCtor,
            createRockPattern: (image: RuntimeSprite) => {
                return this.dependencies.CanvasTools.createScaledPattern({
                    context: this.context,
                    document: this.document,
                    image
                });
            },
            onAmmoLoaded: this.renderHud
        });
        this.assets.load();
    };

    private initHudOverlay = () => {
        const ui = this.dependencies.ClientUi.create({
            document: this.document,
            localStorage: this.window.localStorage,
            onRenderRequest: () => {
                if (this.ammo) {
                    this.renderHud();
                }
            },
            window: this.window
        }) as RuntimeUi;

        this.app = ui.app;
        this.installPrompt = ui.installPrompt;
    };

    private initAmmoHudRenderer = () => {
        this.ammoHudRenderer = new this.dependencies.AmmoHudRenderer({
            context: this.hudContext,
            sprite: this.assets.sprites.ammo
        });
    };

    private initSoundEffects = () => {
        this.gameSounds = new this.dependencies.ClientGameSounds({
            soundEffects: new this.dependencies.SoundEffects()
        });
    };

    private initScenarioRenderer = () => {
        this.scenarioRenderer = new this.dependencies.ScenarioRenderer({
            context: this.context,
            getObstacleDamage: this.getObstacleDamage,
            getRockPattern: () => {
                return this.assets.getRockPattern();
            },
            getScenarioStartedAt: () => {
                return this.roundData.getScenarioStartedAt();
            },
            sprites: {
                cactus: this.assets.sprites.cactus,
                saloon: this.assets.sprites.saloon,
                wagon: this.assets.sprites.wagon
            }
        });
    };

    private initCollisionDebugRenderer = () => {
        this.collisionDebugRenderer =
            new this.dependencies.CollisionDebugRenderer(this.context);
    };

    private initIdentity = () => {
        this.identity = new this.dependencies.ClientIdentity({
            getClientName: this.getClientName,
            storage: this.window.localStorage
        });
    };

    private initNameEditor = () => {
        this.nameEditor = new this.dependencies.NameEditor({
            onChange: this.renderHud,
            onSubmit: this.submitNameChange
        });
    };

    private initCameraController = () => {
        this.cameraController = new this.dependencies.ClientCameraController({
            window: this.window
        });
    };

    private initCamera = () => {
        this.camera = new this.dependencies.Camera({
            worldWidth: this.dependencies.Config.canvas.width,
            worldHeight: this.dependencies.Config.canvas.height,
            screenWidth: this.dependencies.Config.canvas.width,
            screenHeight: this.dependencies.Config.canvas.height,
            scale: this.cameraController.getCameraScale()
        });
    };

    private initGameState = () => {
        const systems = this.dependencies.ClientGameSystems.create({
            initialRoundState: this.RoundState.WAITING,
            playRicochet: this.gameSounds.playRicochet
        }) as RuntimeSystems;

        this.scene = systems.scene;
        this.bullets = systems.bullets;
        this.players = systems.players;
        this.roundIntro = systems.roundIntro;
        this.roundState = systems.roundState;
        this.highScores = systems.highScores;
        this.scoreKeeper = systems.scoreKeeper;
        this.roundData = systems.roundData;
        this.timers = systems.timers;
        this.positionSync = systems.positionSync;
        this.ammo = systems.ammo;
        this.localReadyRequested = systems.localReadyRequested;
    };

    private initGameLoop = () => {
        this.gameLoop = new this.dependencies.ClientGameLoop({
            render: this.renderFrame,
            scheduleFrame: this.dependencies.requestAnimFrame,
            update: this.updateFrame
        });
    };

    private initTouchControls = () => {
        this.touchControls = new this.dependencies.TouchControls({
            input: this.inputController,
            getAimLevel: this.getLocalAimLevel
        });
        this.updateTouchControls();
    };

    private startInputAndAnimation = () => {
        this.inputController = this.dependencies.ClientInputStartup.start({
            createInputController: () => {
                return new this.dependencies.KeysModel(
                    this.socket,
                    this.playerId,
                    this.handleKeyEvent,
                    {
                        canReady: () => {
                            return (
                                !this.nameEditor || !this.nameEditor.isActive()
                            );
                        },
                        onReady: () => {
                            this.localReadyRequested = true;
                            this.renderHud();
                        }
                    }
                );
            },
            initTouchControls: (
                nextInputController: RuntimeInputController
            ) => {
                this.inputController = nextInputController;
                this.initTouchControls();
            },
            inputController: this.inputController,
            startGameLoop: () => {
                this.initGameLoop();
                this.gameLoop.start();
            }
        });
    };

    private renderHud = () => {
        if (!this.app || !this.ammo || !this.hudCanvas || !this.hudContext) {
            return;
        }

        this.dependencies.ClientHudFlow.render({
            ammo: this.ammo,
            ammoHudRenderer: this.ammoHudRenderer,
            app: this.app,
            camera: this.camera,
            cameraController: this.cameraController,
            canvas: this.canvas,
            defaultSeconds: this.dependencies.Config.game.seconds,
            hudCanvas: this.hudCanvas,
            hudContext: this.hudContext,
            model: this.latestModel,
            players: this.players,
            getInstallPromptProps: this.getInstallPromptProps,
            getLobbyHudState: this.getLobbyHudState,
            getTouchControlsProps: this.updateTouchControls,
            roundData: this.roundData,
            roundState: this.roundState,
            scoreKeeper: this.scoreKeeper
        });
    };

    private updateFrame = () => {
        this.dependencies.ClientFrameFlow.update({
            checkForHits: this.checkForHits,
            roundIntro: this.roundIntro,
            scene: this.scene,
            syncLocalPlayerPosition: this.syncLocalPlayerPosition,
            updateBulletCollisionEnvironment:
                this.updateBulletCollisionEnvironment,
            updateCamera: this.updateCamera,
            updateMovementObstacleEnvironment:
                this.updateMovementObstacleEnvironment
        });
    };

    private renderFrame = () => {
        this.dependencies.ClientFrameFlow.render({
            camera: this.camera,
            canvas: this.canvas,
            context: this.context,
            drawCollisionBodies: this.drawCollisionBodies,
            drawScenario: this.drawScenario,
            renderHud: this.renderHud,
            roundState: this.roundState,
            scene: this.scene,
            shouldUseCamera: this.shouldUseCamera,
            updateTouchControls: this.updateTouchControls
        });
    };

    private onHighScores = (nextHighScores: unknown) => {
        this.highScores = Array.isArray(nextHighScores)
            ? (nextHighScores as HighScoreEntry[])
            : [];
        this.renderHud();
    };

    private onJoinedGame = (data: RuntimeJoinedGamePayload) => {
        this.playerId = data.playerId;
        this.syncPlayers(data.model);
        this.startInputAndAnimation();
    };

    private syncPlayers = (model: RuntimeGameModel) => {
        const previousModel = this.latestModel;

        this.latestModel = model;

        this.dependencies.ClientModelUpdateFlow.sync({
            clearAbandonedRequeue: this.clearAbandonedRequeue,
            clearLocalReadyRequest: () => {
                this.localReadyRequested = false;
            },
            enterLobbyState: this.enterLobbyState,
            model,
            playerId: this.playerId,
            players: this.players,
            playReadySound: this.gameSounds.playReady,
            previousModel,
            renderHud: this.renderHud,
            roundState: this.roundState,
            scheduleAbandonedRequeue: this.scheduleAbandonedRequeue,
            startRoundRitual: this.startRoundRitual,
            syncNameEditor: this.syncNameEditor,
            syncStoredPlayerName: this.syncStoredPlayerName
        });
    };

    private handleKeyEvent = (keyEvent: RuntimeKeyEvent) => {
        return this.dependencies.ClientKeyEventFlow.handle({
            ammo: this.ammo,
            bullets: this.bullets,
            isLocalClientWaiting: this.isLocalClientWaiting,
            keyEvent,
            nameEditor: this.nameEditor,
            onGunFired: this.gameSounds.playGun,
            onBulletFired: () => {
                this.reloadIfBothPlayersAreOutOfAmmo();
                this.renderHud();
            },
            onEmptyGun: this.gameSounds.playEmptyGun,
            player: this.getPlayer(keyEvent.player),
            playerId: this.playerId,
            renderHud: this.renderHud,
            roundState: this.roundState
        });
    };

    private applyRemotePlayerPosition = (
        data: RuntimePlayerPositionPayload
    ) => {
        this.positionSync.applyRemote({
            data,
            localPlayerId: this.playerId,
            players: this.players,
            playing: this.roundState === this.RoundState.PLAYING
        });
    };

    private applyObstacleDamage = (data: RuntimeObstacleDamagePayload) => {
        this.dependencies.ClientObstacleSync.applyDamage({
            bullets: this.bullets,
            damageObstacle: this.damageObstacle,
            data,
            model: this.latestModel,
            playObstacleHit: this.gameSounds.playObstacleHit
        });
    };

    private setRoundState = (nextState: RoundStateValue) => {
        this.roundState = this.dependencies.ClientRoundTransition.resolve({
            canTransition: this.dependencies.ClientScreens.canTransition,
            currentState: this.roundState,
            nextState
        });
    };

    private setRoundMessage = (message: string) => {
        this.roundData.setRoundMessage(message);
        this.renderHud();
    };

    private startRoundRitual = (options?: { resetScores?: boolean }) => {
        options = options || {};

        this.dependencies.ClientRoundRitual.start({
            bullets: this.bullets,
            closeNameEditor: this.closeNameEditor,
            endGame: this.endGame,
            hasMatchTimeExpired: this.roundData.hasMatchTimeExpired,
            renderHud: this.renderHud,
            resetAmmo: this.resetAmmo,
            resetScores: options.resetScores,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scheduleMatchEnd: this.scheduleMatchEnd,
            scoreKeeper: this.scoreKeeper,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            timers: this.timers
        });
    };

    private scheduleMatchEnd = () => {
        this.dependencies.ClientMatchTimer.scheduleEnd({
            endGame: this.endGame,
            roundData: this.roundData,
            timers: this.timers
        });
    };

    private checkForHits = () => {
        const result = this.dependencies.ClientHitDetection.check({
            bullets: this.bullets,
            collision: this.dependencies.Collision,
            findBulletObstacleHit: this.findBulletObstacleHit,
            matchTimeExpired: this.roundData.hasMatchTimeExpired(),
            players: this.players,
            roundState: this.roundState
        }) as RuntimeHitDetectionResult;

        if (result.type === 'matchExpired') {
            this.endGame();
            return;
        }

        if (result.type === 'obstacleHit') {
            this.handleObstacleHit(result.hit);
            return;
        }

        if (result.type === 'playerHit') {
            this.handlePlayerHit(result.hit);
        }
    };

    private handleObstacleHit = (hit: RuntimeObstacleHit) => {
        this.dependencies.ClientObstacleSync.handleLocalHit({
            applyDamage: this.applyObstacleDamage,
            hit,
            model: this.latestModel,
            playerId: this.playerId,
            socket: this.socket
        });
    };

    private handlePlayerHit = (hit: RuntimePlayerHit) => {
        this.dependencies.ClientPlayerHitFlow.handleHit({
            bullets: this.bullets,
            hit,
            playerId: this.playerId,
            players: this.players,
            playPain: this.gameSounds.playPain,
            renderHud: this.renderHud,
            resetAfterHit: this.resetAfterHit,
            roundData: this.roundData,
            scoreKeeper: this.scoreKeeper,
            setRoundState: this.setRoundState,
            timers: this.timers,
            winnerSlot: this.getPlayerSlot(hit.winnerId)
        });
    };

    private resetAfterHit = () => {
        this.dependencies.ClientPlayerHitFlow.resetAfterHit({
            bullets: this.bullets,
            endGame: this.endGame,
            hasMatchTimeExpired: this.roundData.hasMatchTimeExpired,
            players: this.players,
            resetAmmo: this.resetAmmo,
            roundData: this.roundData,
            socket: this.socket,
            startRoundRitual: this.startRoundRitual
        });
    };

    private endRound = (winnerId?: ClientId | null) => {
        this.dependencies.ClientRoundEndFlow.endRound({
            bullets: this.bullets,
            closeNameEditor: this.closeNameEditor,
            getPlayerSlot: this.getPlayerSlot,
            players: this.players,
            renderHud: this.renderHud,
            resetRound: this.resetRound,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scoreKeeper: this.scoreKeeper,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            timers: this.timers,
            winnerId
        });
    };

    private endGame = () => {
        this.dependencies.ClientRoundEndFlow.endGame({
            bullets: this.bullets,
            closeNameEditor: this.closeNameEditor,
            getClientName: this.getClientName,
            model: this.latestModel,
            players: this.players,
            renderHud: this.renderHud,
            resetToStartScreen: this.resetToStartScreen,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scoreKeeper: this.scoreKeeper,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            socket: this.socket,
            timers: this.timers
        });
    };

    private resetRound = () => {
        this.dependencies.ClientRoundResetFlow.resetRound({
            bullets: this.bullets,
            isReadyToStart: this.dependencies.ClientModelSync.isReadyToStart,
            model: this.latestModel,
            players: this.players,
            renderHud: this.renderHud,
            roundData: this.roundData,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            startRoundRitual: this.startRoundRitual,
            syncNameEditor: this.syncNameEditor,
            timers: this.timers
        });
    };

    private resetToStartScreen = () => {
        this.dependencies.ClientRoundResetFlow.resetToStartScreen({
            bullets: this.bullets,
            players: this.players,
            renderHud: this.renderHud,
            resetAmmo: this.resetAmmo,
            roundData: this.roundData,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            socket: this.socket,
            syncNameEditor: this.syncNameEditor,
            timers: this.timers
        });
    };

    private enterLobbyState = () => {
        this.dependencies.ClientLobbyFlow.enter({
            bullets: this.bullets,
            players: this.players,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scoreKeeper: this.scoreKeeper,
            setRoundState: this.setRoundState,
            syncNameEditor: this.syncNameEditor,
            timers: this.timers
        });
    };

    private scheduleAbandonedRequeue = () => {
        this.dependencies.ClientLobbyFlow.scheduleAbandonedRequeue({
            socket: this.socket,
            timers: this.timers
        });
    };

    private clearAbandonedRequeue = () => {
        this.dependencies.ClientLobbyFlow.clearAbandonedRequeue({
            timers: this.timers
        });
    };

    private syncLocalPlayerPosition = () => {
        this.positionSync.syncLocal({
            playing: this.roundState === this.RoundState.PLAYING,
            player: this.getLocalPlayer(),
            socket: this.socket
        });
    };

    private updateBulletCollisionEnvironment = () => {
        this.dependencies.ClientCollisionEnvironment.updateBulletLines({
            scenario: this.getCurrentScenario(),
            scenarioRenderer: this.scenarioRenderer
        });
    };

    private updateMovementObstacleEnvironment = () => {
        this.dependencies.ClientCollisionEnvironment.updateObstacleBodies({
            roundState: this.roundState,
            scenario: this.getCurrentScenario(),
            scenarioRenderer: this.scenarioRenderer
        });
    };

    private updateCamera = () => {
        this.cameraController.update({
            camera: this.camera,
            canvas: this.canvas,
            player: this.getLocalPlayer(),
            roundState: this.roundState
        });
    };

    private drawScenario = () => {
        this.scenarioRenderer.render(this.getCurrentScenario());
    };

    private drawCollisionBodies = () => {
        this.collisionDebugRenderer.render({
            obstacleBodies: this.dependencies.Obstacles.all(),
            players: this.players.all
        });
    };

    private updateTouchControls = () => {
        return this.dependencies.ClientTouchControlsFlow.update({
            aimLevel: this.getLocalAimLevel(),
            editing: this.nameEditor && this.nameEditor.isActive(),
            highScoresVisible: this.shouldShowHighScoresScreen(),
            ready: this.isLocalClientReady(),
            roundState: this.roundState,
            touchControls: this.touchControls
        });
    };

    private getLobbyHudState = () => {
        return this.dependencies.ClientLobbyHudFlow.getState({
            highScores: this.highScores,
            isTouchInterface: this.isTouchInterface,
            localReadyRequested: this.localReadyRequested,
            model: this.latestModel,
            nameEditor: this.nameEditor,
            onNameEditorSelect: (rowIndex: number, colIndex: number) => {
                this.nameEditor.select(rowIndex, colIndex);
                this.renderHud();
            },
            playerId: this.playerId,
            roundState: this.roundState
        });
    };

    private getInstallPromptProps = () => {
        return this.installPrompt && this.installPrompt.getProps
            ? this.installPrompt.getProps()
            : undefined;
    };

    private getCurrentScenario = () => {
        return this.latestModel && this.latestModel.currentScenario;
    };

    private findBulletObstacleHit = () => {
        return this.scenarioRenderer.findBulletObstacleHit(
            this.bullets.all(),
            this.getCurrentScenario()
        );
    };

    private getObstacleDamage = (id: string) => {
        return this.roundData.getObstacleDamage(id);
    };

    private damageObstacle = (id: string) => {
        this.roundData.damageObstacle(id);
    };

    private getPlayerSlot = (id?: ClientId | null) => {
        if (!this.latestModel) {
            return -1;
        }

        return this.latestModel.clients.findIndex(function (client) {
            return client.id === id;
        });
    };

    private getPlayer = (id?: ClientId | null) => {
        if (id === null || typeof id === 'undefined') {
            return undefined;
        }

        return this.players.all[id];
    };

    private getLocalPlayer = () => {
        return this.getPlayer(this.playerId);
    };

    private getLocalClient = () => {
        return this.dependencies.ClientLobbyViewModel.getLocalClient(
            this.latestModel,
            this.playerId
        );
    };

    private getClientName = (client: RuntimeClient) => {
        return this.dependencies.ClientLobbyViewModel.getClientName(client);
    };

    private getStoredPlayerName = () => {
        return this.identity.getStoredPlayerName();
    };

    private getLocalAimLevel = () => {
        return this.dependencies.ClientTouchControlsFlow.getLocalAimLevel({
            defaultAim: this.dependencies.Config.player.defaultAim,
            player: this.getLocalPlayer()
        });
    };

    private isTouchInterface = () => {
        return this.dependencies.ClientTouchEnvironment.isTouchInterface(
            this.window
        );
    };

    private shouldUseCamera = () => {
        return this.cameraController.shouldUseCamera({
            camera: this.camera,
            roundState: this.roundState
        });
    };

    private shouldShowHighScoresScreen = () => {
        return this.dependencies.ClientLobbyViewModel.shouldShowHighScoresScreen(
            {
                localReadyRequested: this.localReadyRequested,
                model: this.latestModel
            }
        );
    };

    private isLocalClientReady = () => {
        return this.dependencies.ClientLobbyViewModel.isLocalClientReady({
            localReadyRequested: this.localReadyRequested,
            model: this.latestModel,
            playerId: this.playerId
        });
    };

    private isLocalClientWaiting = () => {
        return this.dependencies.ClientLobbyViewModel.isLocalClientWaiting({
            localReadyRequested: this.localReadyRequested,
            model: this.latestModel,
            playerId: this.playerId
        });
    };

    private submitNameChange = (name: string) => {
        this.dependencies.ClientNameEditorFlow.submitNameChange({
            name,
            socket: this.socket
        });
    };

    private syncNameEditor = () => {
        this.dependencies.ClientNameEditorFlow.sync({
            client: this.getLocalClient(),
            identity: this.identity,
            editor: this.nameEditor
        });
    };

    private closeNameEditor = () => {
        this.dependencies.ClientNameEditorFlow.close(this.nameEditor);
    };

    private syncStoredPlayerName = () => {
        this.identity.syncStoredPlayerName(this.getLocalClient());
    };

    private resetAmmo = () => {
        this.ammo.reset(this.latestModel?.clients);
    };

    private reloadIfBothPlayersAreOutOfAmmo = () => {
        this.dependencies.ClientAmmoFlow.reloadIfBothPlayersAreOut({
            ammo: this.ammo,
            model: this.latestModel,
            roundState: this.roundState
        });
    };
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
