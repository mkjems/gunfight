import type { HighScoreEntry, Scenario } from '../../../shared/contracts.js';
import type { AmmoHudRenderer } from '../ui/ammoHudRenderer.js';
import type { Camera } from '../engine/camera.js';
import type { CanvasTools } from '../platform/canvasTools.js';
import type { ClientAmmoFlow } from '../flows/clientAmmoFlow.js';
import type { ClientAssets } from '../platform/clientAssets.js';
import type { ClientCameraController } from '../engine/clientCameraController.js';
import type { ClientCanvasSetup } from '../platform/clientCanvasSetup.js';
import type { ClientFrameFlow } from '../flows/clientFrameFlow.js';
import type { ClientGameLoop } from './clientGameLoop.js';
import type { ClientGameSounds } from '../platform/clientGameSounds.js';
import type { ClientHitDetection } from '../flows/clientHitDetection.js';
import type { ClientHudFlow } from '../flows/clientHudFlow.js';
import type { ClientIdentity } from '../platform/clientIdentity.js';
import type { ClientInputStartup } from './clientInputStartup.js';
import type { ClientKeyEventFlow } from '../flows/clientKeyEventFlow.js';
import type { ClientLobbyFlow } from '../flows/clientLobbyFlow.js';
import type { ClientLobbyHudFlow } from '../flows/clientLobbyHudFlow.js';
import type { ClientLobbyViewModel } from '../ui/viewModels/clientLobbyViewModel.js';
import type { ClientMatchTimer } from '../flows/clientMatchTimer.js';
import type { ClientModelSync } from '../network/clientModelSync.js';
import type { ClientModelUpdateFlow } from '../network/clientModelUpdateFlow.js';
import type { ClientNameEditorFlow } from '../flows/clientNameEditorFlow.js';
import type { ClientNetwork } from '../network/clientNetwork.js';
import type { ClientObstacleSync } from '../network/clientObstacleSync.js';
import type { ClientPlayerHitFlow } from '../flows/clientPlayerHitFlow.js';
import type { ClientRoundEndFlow } from '../flows/clientRoundEndFlow.js';
import type { ClientRoundResetFlow } from '../flows/clientRoundResetFlow.js';
import type { ClientRoundRitual } from '../flows/clientRoundRitual.js';
import type { ClientRoundTransition } from '../flows/clientRoundTransition.js';
import type { ClientRuntimeCollisionEnvironment } from '../engine/clientRuntimeCollisionEnvironment.js';
import type { ClientRuntimeGameSystems } from './clientRuntimeGameSystems.js';
import type { ClientScreens } from '../state/clientScreens.js';
import type { ClientTouchControlsFlow } from '../flows/clientTouchControlsFlow.js';
import type { ClientTouchEnvironment } from '../input/clientTouchEnvironment.js';
import type { ClientUi } from '../ui/clientUi.js';
import type { Collision } from '../engine/collision.js';
import type { CollisionDebugRenderer } from '../engine/collisionDebugRenderer.js';
import type { Config } from '../platform/config.js';
import type { KeysModel } from '../input/keysModel.js';
import type { NameEditor } from '../input/nameEditor.js';
import type { Obstacles } from '../engine/obstacles.js';
import type { requestAnimFrame } from '../platform/requestAnimationFrame.js';
import type { ScenarioRenderer } from '../engine/scenarioRenderer.js';
import type { SoundEffects } from '../platform/soundEffects.js';
import type { TouchControls } from '../input/touchControls.js';
import type { RoundState as RoundStateValue } from '../state/clientScreens.js';

type ClientId = number | string;

type RuntimeSprite = CanvasImageSource & {
    complete?: boolean;
    height: number;
    onload?: ((this: GlobalEventHandlers, ev: Event) => unknown) | null;
    src?: string;
    width: number;
};

type RuntimeBox = {
    height: number;
    width: number;
    x: number;
    y: number;
};

type RuntimeCircle = {
    radius: number;
    x: number;
    y: number;
};

type RuntimeCollisionLine = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};

type RuntimeObstacleBody =
    | {
          damage?: number;
          id?: string;
          radius: number;
          type?: 'circle';
          x: number;
          y: number;
      }
    | {
          damage?: number;
          height: number;
          id?: string;
          type: 'rect';
          width: number;
          x: number;
          y: number;
      }
    | {
          points: Array<{ x: number; y: number }>;
          type: 'polygon';
      };

type RuntimeRenderContext = {
    clearRect: (x: number, y: number, width: number, height: number) => void;
    restore: () => void;
    save: () => void;
    scale: (x: number, y: number) => void;
    translate: (x: number, y: number) => void;
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
    apply: (context: RuntimeRenderContext) => void;
    follow: (player?: { x: number; y: number } | null) => void;
    reset: () => void;
    scale: number;
    setScale: (scale: number) => void;
    setScreenSize: (width: number, height: number) => void;
    setVisibleScreen: (
        x: number,
        y: number,
        width: number,
        height: number
    ) => void;
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
    drawAll: (context: RuntimeRenderContext) => void;
    moveAll: () => void;
};

type RuntimePlayer = {
    aim: number;
    clearDeathAnimation: () => void;
    facing: number;
    frame: number;
    getAim?: () => number;
    getCollisionCircles: (x?: number, y?: number) => RuntimeCircle[];
    getHitBox: () => RuntimeBox;
    playerId: ClientId;
    playDeathAnimation?: () => void;
    respondToKeyEvent?: (keyEvent: RuntimeKeyEvent) => void;
    x: number;
    y: number;
};

type RuntimePlayers = {
    all: Record<string, RuntimePlayer>;
    clearKeys: () => void;
    label: (id?: ClientId | null) => string;
    resetAll: (options: { slots: unknown }) => void;
    sync: (model: RuntimeGameModel | null, options: unknown) => void;
};

type RuntimeBullet = {
    deleteMe?: boolean;
    getHitBox: () => RuntimeBox;
    hasRicocheted?: boolean;
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

type RuntimeAmmoClient = {
    id: ClientId;
};

type RuntimeAmmo = {
    get: (clientId: ClientId) => number;
    hasAmmo: (clientId: ClientId) => boolean;
    reloadIfAllEmpty: (clients?: RuntimeAmmoClient[]) => boolean;
    reset: (clients?: RuntimeAmmoClient[]) => void;
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

type RuntimeNamedClient = {
    name?: string;
    slot?: number;
};

type RuntimeScoreClient = RuntimeNamedClient & {
    slot: number;
};

type RuntimeScoreKeeper = {
    addPoint: (slot: number) => void;
    createGameResult?: (
        model?: {
            clients?: RuntimeScoreClient[];
            gameId?: string;
            roundNumber?: number;
        } | null,
        getClientName?: (client: RuntimeScoreClient) => string
    ) => unknown;
    getGameOverMessage: (
        clients?: RuntimeScoreClient[],
        getClientName?: (client: RuntimeScoreClient) => string
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
    getObstacleBodies: (scenario?: Scenario | null) => RuntimeObstacleBody[];
    getRockLines: (scenario?: Scenario | null) => RuntimeCollisionLine[];
    render: (scenario?: Scenario | null) => void;
};

type RuntimeCollisionDebugRenderer = {
    render: (options: {
        obstacleBodies?: RuntimeObstacleBody[];
        players?: Record<string, RuntimePlayer>;
    }) => void;
};

type RuntimeNameEditor = {
    close: (options?: { submit?: boolean }) => void;
    getState: () => unknown;
    handleKeyEvent: (keyEvent: RuntimeKeyEvent) => false | unknown;
    isActive: () => boolean;
    open: (name?: unknown) => void;
    select: (rowIndex: number, colIndex: number) => void;
    setName: (name: string) => void;
};

type RuntimeIdentity = {
    getStoredPlayerName: () => string;
    syncNameEditor: (options: {
        client?: RuntimeNamedClient | null;
        editor?: {
            isActive: () => boolean;
            setName: (name: string) => void;
        } | null;
    }) => boolean;
    syncStoredPlayerName: (client?: RuntimeNamedClient | null) => boolean;
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
    update: (state?: RuntimeTouchControlsState) => unknown;
};

type RuntimeTouchControlsState = {
    aimLevel?: number;
    editing?: boolean;
    gameplay?: boolean;
    highScoresVisible?: boolean;
    playing?: boolean;
    ready?: boolean;
    waiting?: boolean;
};

type RuntimeSocket = {
    emit: (event: string, payload?: unknown) => void;
};

type RuntimeClient = RuntimeNamedClient & {
    id: ClientId;
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
    aim: number;
    facing: number;
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
    AmmoHudRenderer: typeof AmmoHudRenderer;
    Camera: typeof Camera;
    CanvasTools: typeof CanvasTools;
    ClientAmmoFlow: typeof ClientAmmoFlow;
    ClientAssets: typeof ClientAssets;
    ClientCameraController: typeof ClientCameraController;
    ClientCanvasSetup: typeof ClientCanvasSetup;
    ClientCollisionEnvironment: typeof ClientRuntimeCollisionEnvironment;
    ClientFrameFlow: typeof ClientFrameFlow;
    ClientGameLoop: typeof ClientGameLoop;
    ClientGameSounds: typeof ClientGameSounds;
    ClientGameSystems: typeof ClientRuntimeGameSystems;
    ClientHitDetection: typeof ClientHitDetection;
    ClientHudFlow: typeof ClientHudFlow;
    ClientIdentity: typeof ClientIdentity;
    ClientInputStartup: typeof ClientInputStartup;
    ClientKeyEventFlow: typeof ClientKeyEventFlow;
    ClientLobbyFlow: typeof ClientLobbyFlow;
    ClientLobbyHudFlow: typeof ClientLobbyHudFlow;
    ClientLobbyViewModel: typeof ClientLobbyViewModel;
    ClientMatchTimer: typeof ClientMatchTimer;
    ClientModelSync: typeof ClientModelSync;
    ClientModelUpdateFlow: typeof ClientModelUpdateFlow;
    ClientNameEditorFlow: typeof ClientNameEditorFlow;
    ClientNetwork: typeof ClientNetwork;
    ClientObstacleSync: typeof ClientObstacleSync;
    ClientPlayerHitFlow: typeof ClientPlayerHitFlow;
    ClientRoundEndFlow: typeof ClientRoundEndFlow;
    ClientRoundResetFlow: typeof ClientRoundResetFlow;
    ClientRoundRitual: typeof ClientRoundRitual;
    ClientRoundTransition: typeof ClientRoundTransition;
    ClientScreens: typeof ClientScreens;
    ClientTouchControlsFlow: typeof ClientTouchControlsFlow;
    ClientTouchEnvironment: typeof ClientTouchEnvironment;
    Collision: typeof Collision;
    CollisionDebugRenderer: typeof CollisionDebugRenderer;
    Config: typeof Config;
    KeysModel: typeof KeysModel;
    NameEditor: typeof NameEditor;
    Obstacles: typeof Obstacles;
    requestAnimFrame: typeof requestAnimFrame;
    ScenarioRenderer: typeof ScenarioRenderer;
    SoundEffects: typeof SoundEffects;
    TouchControls: typeof TouchControls;
    ClientUi: typeof ClientUi;
};

export type ClientGameDependencies = {
    bootstrap: {
        ClientAssets: typeof ClientAssets;
        ClientCanvasSetup: typeof ClientCanvasSetup;
        ClientGameLoop: typeof ClientGameLoop;
        ClientGameSystems: typeof ClientRuntimeGameSystems;
        ClientInputStartup: typeof ClientInputStartup;
        ClientNetwork: typeof ClientNetwork;
        requestAnimFrame: typeof requestAnimFrame;
    };
    environment: {
        CanvasTools: typeof CanvasTools;
        ClientCollisionEnvironment: typeof ClientRuntimeCollisionEnvironment;
        Collision: typeof Collision;
        Obstacles: typeof Obstacles;
    };
    flow: {
        ClientAmmoFlow: typeof ClientAmmoFlow;
        ClientFrameFlow: typeof ClientFrameFlow;
        ClientHitDetection: typeof ClientHitDetection;
        ClientKeyEventFlow: typeof ClientKeyEventFlow;
        ClientLobbyFlow: typeof ClientLobbyFlow;
        ClientMatchTimer: typeof ClientMatchTimer;
        ClientModelUpdateFlow: typeof ClientModelUpdateFlow;
        ClientNameEditorFlow: typeof ClientNameEditorFlow;
        ClientObstacleSync: typeof ClientObstacleSync;
        ClientPlayerHitFlow: typeof ClientPlayerHitFlow;
        ClientRoundEndFlow: typeof ClientRoundEndFlow;
        ClientRoundResetFlow: typeof ClientRoundResetFlow;
        ClientRoundRitual: typeof ClientRoundRitual;
        ClientRoundTransition: typeof ClientRoundTransition;
        ClientTouchControlsFlow: typeof ClientTouchControlsFlow;
    };
    model: {
        ClientLobbyViewModel: typeof ClientLobbyViewModel;
        ClientModelSync: typeof ClientModelSync;
        ClientScreens: ClientGameRuntimeModules['ClientScreens'];
    };
    platform: {
        Config: ClientGameRuntimeModules['Config'];
    };
    ui: {
        AmmoHudRenderer: typeof AmmoHudRenderer;
        ClientHudFlow: typeof ClientHudFlow;
        ClientLobbyHudFlow: typeof ClientLobbyHudFlow;
        ClientUi: typeof ClientUi;
    };
    browserConstructors: {
        Camera: typeof Camera;
        ClientCameraController: typeof ClientCameraController;
        ClientGameSounds: typeof ClientGameSounds;
        ClientIdentity: typeof ClientIdentity;
        ClientTouchEnvironment: typeof ClientTouchEnvironment;
        CollisionDebugRenderer: typeof CollisionDebugRenderer;
        KeysModel: typeof KeysModel;
        NameEditor: typeof NameEditor;
        ScenarioRenderer: typeof ScenarioRenderer;
        SoundEffects: typeof SoundEffects;
        TouchControls: typeof TouchControls;
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

        this.socket = this.dependencies.ClientNetwork({
            getStoredPlayerName: this.getStoredPlayerName,
            onHighScores: this.onHighScores,
            onJoinedGame: this.onJoinedGame,
            onKeyEvent: this.onKeyEvent,
            onPlayerPosition: this.applyRemotePlayerPosition,
            onObstacleDamage: this.applyObstacleDamage,
            onModelUpdate: this.onModelUpdate
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
        this.assets = this.dependencies.ClientAssets({
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
        this.gameSounds = this.dependencies.ClientGameSounds({
            soundEffects: new this.dependencies.SoundEffects()
        });
    };

    private initScenarioRenderer = () => {
        this.scenarioRenderer = this.dependencies.ScenarioRenderer({
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
        this.collisionDebugRenderer = this.dependencies.CollisionDebugRenderer(
            this.context
        );
    };

    private initIdentity = () => {
        this.identity = this.dependencies.ClientIdentity({
            getClientName: this.getClientName,
            storage: this.window.localStorage
        });
    };

    private initNameEditor = () => {
        this.nameEditor = this.dependencies.NameEditor({
            onChange: this.renderHud,
            onSubmit: this.submitNameChange
        });
    };

    private initCameraController = () => {
        this.cameraController = this.dependencies.ClientCameraController({
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
        this.gameLoop = this.dependencies.ClientGameLoop({
            render: this.renderFrame,
            scheduleFrame: this.dependencies.requestAnimFrame,
            update: this.updateFrame
        });
    };

    private initTouchControls = () => {
        this.touchControls = this.dependencies.TouchControls({
            input: this.inputController,
            getAimLevel: this.getLocalAimLevel
        });
        this.updateTouchControls();
    };

    private startInputAndAnimation = () => {
        this.inputController = this.dependencies.ClientInputStartup.start({
            createInputController: () => {
                const playerId = this.playerId;

                if (playerId === null) {
                    throw new Error('Cannot start input before joining a game');
                }

                return this.dependencies.KeysModel(
                    this.socket,
                    playerId,
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

    private onJoinedGame = (data: unknown) => {
        const joinedGame = parseJoinedGamePayload(data);

        if (!joinedGame) {
            return;
        }

        this.playerId = joinedGame.playerId;
        this.syncPlayers(joinedGame.model);
        this.startInputAndAnimation();
    };

    private onModelUpdate = (data: unknown) => {
        const model = parseGameModel(data);

        if (model) {
            this.syncPlayers(model);
        }
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
            playerId: this.playerId ?? undefined,
            renderHud: this.renderHud,
            roundState: this.roundState
        });
    };

    private onKeyEvent = (data: unknown) => {
        const keyEvent = parseKeyEvent(data);

        if (keyEvent) {
            return this.handleKeyEvent(keyEvent);
        }

        return false;
    };

    private applyRemotePlayerPosition = (data: unknown) => {
        const position = parsePlayerPositionPayload(data);

        if (!position) {
            return;
        }

        this.positionSync.applyRemote({
            data: position,
            localPlayerId: this.playerId,
            players: this.players,
            playing: this.roundState === this.RoundState.PLAYING
        });
    };

    private applyObstacleDamage = (data: unknown) => {
        const obstacleDamage = parseObstacleDamagePayload(data);

        if (!obstacleDamage) {
            return;
        }

        this.dependencies.ClientObstacleSync.applyDamage({
            bullets: this.bullets,
            damageObstacle: this.damageObstacle,
            data: obstacleDamage,
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
        if (this.playerId === null) {
            return;
        }

        this.dependencies.ClientObstacleSync.handleLocalHit({
            applyDamage: this.applyObstacleDamage,
            hit,
            model: this.latestModel,
            playerId: this.playerId,
            socket: this.socket
        });
    };

    private handlePlayerHit = (hit: RuntimePlayerHit) => {
        if (this.playerId === null) {
            return;
        }

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
            roundState: this.roundState,
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

    private getClientName = (client: RuntimeNamedClient) => {
        return this.dependencies.ClientLobbyViewModel.getClientName({
            id: '',
            ...client
        });
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

type RuntimeDataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RuntimeDataRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isClientId(value: unknown): value is ClientId {
    return typeof value === 'number' || typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function parseClient(data: unknown): RuntimeClient | null {
    if (!isRecord(data) || !isClientId(data.id) || !isFiniteNumber(data.slot)) {
        return null;
    }

    const client: RuntimeClient = {
        id: data.id,
        slot: data.slot
    };

    if (typeof data.name === 'string') {
        client.name = data.name;
    }

    if (typeof data.ready === 'boolean') {
        client.ready = data.ready;
    }

    return client;
}

function parseGameModel(data: unknown): RuntimeGameModel | null {
    if (!isRecord(data) || !Array.isArray(data.clients)) {
        return null;
    }

    const clients: RuntimeClient[] = [];

    for (const clientData of data.clients) {
        const client = parseClient(clientData);

        if (!client) {
            return null;
        }

        clients.push(client);
    }

    const model: RuntimeGameModel = {
        clients
    };

    if (typeof data.gameId === 'string') {
        model.gameId = data.gameId;
    }

    if (typeof data.message === 'string') {
        model.message = data.message;
    }

    if (isFiniteNumber(data.playerLimit)) {
        model.playerLimit = data.playerLimit;
    }

    if (isFiniteNumber(data.roundNumber)) {
        model.roundNumber = data.roundNumber;
    }

    if (typeof data.status === 'string') {
        model.status = data.status;
    }

    if (data.currentScenario === null) {
        model.currentScenario = null;
    } else if (isRecord(data.currentScenario)) {
        model.currentScenario = data.currentScenario as Scenario;
    }

    return model;
}

function parseJoinedGamePayload(
    data: unknown
): RuntimeJoinedGamePayload | null {
    if (!isRecord(data) || !isClientId(data.playerId)) {
        return null;
    }

    const model = parseGameModel(data.model);

    if (!model) {
        return null;
    }

    return {
        model,
        playerId: data.playerId
    };
}

function parseKeyEvent(data: unknown): RuntimeKeyEvent | null {
    if (
        !isRecord(data) ||
        typeof data.action !== 'string' ||
        typeof data.key !== 'string'
    ) {
        return null;
    }

    const keyEvent: RuntimeKeyEvent = {
        action: data.action,
        key: data.key
    };

    if (isClientId(data.player)) {
        keyEvent.player = data.player;
    }

    if (data.shot !== undefined) {
        keyEvent.shot = data.shot;
    }

    return keyEvent;
}

function parsePlayerPositionPayload(
    data: unknown
): RuntimePlayerPositionPayload | null {
    if (
        !isRecord(data) ||
        !isClientId(data.player) ||
        !isFiniteNumber(data.aim) ||
        !isFiniteNumber(data.facing) ||
        !isFiniteNumber(data.frame) ||
        !isFiniteNumber(data.x) ||
        !isFiniteNumber(data.y)
    ) {
        return null;
    }

    return {
        aim: data.aim,
        facing: data.facing,
        frame: data.frame,
        player: data.player,
        x: data.x,
        y: data.y
    };
}

function parseObstacleDamagePayload(
    data: unknown
): RuntimeObstacleDamagePayload | null {
    if (!isRecord(data) || typeof data.id !== 'string') {
        return null;
    }

    if (!isClientId(data.ownerId)) {
        return null;
    }

    const payload: RuntimeObstacleDamagePayload = {
        id: data.id,
        ownerId: data.ownerId
    };

    if (isFiniteNumber(data.roundNumber)) {
        payload.roundNumber = data.roundNumber;
    }

    return payload;
}
