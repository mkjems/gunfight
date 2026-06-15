import type { HighScoreEntry, Scenario } from '../../../../shared/contracts.js';
import type { RoundState as RoundStateValue } from '../../state/clientScreens.js';

export type ClientId = number | string;

export type RuntimeSprite = CanvasImageSource & {
    complete?: boolean;
    height: number;
    onload?: ((this: GlobalEventHandlers, ev: Event) => unknown) | null;
    src?: string;
    width: number;
};

export type RuntimeBox = {
    height: number;
    width: number;
    x: number;
    y: number;
};

export type RuntimeCircle = {
    radius: number;
    x: number;
    y: number;
};

export type RuntimeCollisionLine = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};

export type RuntimeObstacleBody =
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

export type RuntimeRenderContext = {
    clearRect: (x: number, y: number, width: number, height: number) => void;
    fillRect?: (x: number, y: number, width: number, height: number) => void;
    fillStyle?: string;
    restore: () => void;
    save: () => void;
    scale: (x: number, y: number) => void;
    translate: (x: number, y: number) => void;
};

export type RuntimeCanvasSurfaces = {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    hudCanvas: HTMLCanvasElement;
    hudContext: CanvasRenderingContext2D;
    particleCanvas: HTMLCanvasElement;
    particleContext: CanvasRenderingContext2D;
};

export type RuntimeApp = {
    render: (state: unknown) => unknown;
};

export type RuntimeInstallPrompt = {
    getProps?: () => unknown;
};

export type RuntimeAssets = {
    getRockPattern: () => CanvasPattern | null;
    load: () => void;
    sprites: {
        cactus: RuntimeSprite;
        saloon: RuntimeSprite;
        wagon: RuntimeSprite;
    };
};

export type RuntimeUi = {
    app: RuntimeApp;
    installPrompt?: RuntimeInstallPrompt;
};

export type RuntimeCamera = {
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

export type RuntimeCameraController = {
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

export type RuntimeGameSounds = {
    playEmptyGun: () => void;
    playGun: () => void;
    playObstacleHit: (id?: string | null) => void;
    playPain: () => void;
    playReady: () => void;
    playRicochet: () => void;
};

export type RuntimeGameLoop = {
    start: () => unknown;
};

export type RuntimeScene = {
    drawAll: (context: RuntimeRenderContext) => void;
    moveAll: () => void;
};

export type RuntimePlayer = {
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

export type RuntimePlayers = {
    all: Record<string, RuntimePlayer>;
    clearKeys: () => void;
    label: (id?: ClientId | null) => string;
    resetAll: (options: { slots: unknown }) => void;
    sync: (model: RuntimeGameModel | null, options: unknown) => void;
};

export type RuntimeBullet = {
    deleteMe?: boolean;
    facing?: number;
    getHitBox: () => RuntimeBox;
    hasRicocheted?: boolean;
    ownerId: ClientId;
    speedX?: number;
    speedY?: number;
    toSnapshot?: () => unknown;
    x?: number;
    y?: number;
};

export type RuntimeBullets = {
    all: () => Record<string, RuntimeBullet | null | undefined>;
    clear: () => void;
    fire: (
        player: RuntimePlayer,
        shot?: unknown
    ) => RuntimeBullet | false | null | undefined;
    remove: (id: ClientId) => void;
    reset: () => void;
};

export type RuntimeAmmoClient = {
    id: ClientId;
};

export type RuntimeAmmo = {
    get: (clientId: ClientId) => number;
    hasAmmo: (clientId: ClientId) => boolean;
    reloadIfAllEmpty: (clients?: RuntimeAmmoClient[]) => boolean;
    reset: (clients?: RuntimeAmmoClient[]) => void;
    spend: (clientId: ClientId) => boolean;
};

export type RuntimeRoundData = {
    clearHitMessage: () => void;
    clearObstacleDamage: () => void;
    clearRoundEnd: () => void;
    clearRoundPauseFlags: () => void;
    damageObstacle: (id: string) => void;
    getHitMessage: () => { targetId: ClientId; text: string } | null;
    getObstacleDamage: (id: string) => number;
    getRoundEndsAt: () => number | null | undefined;
    getRoundMessage: () => string;
    getScenarioStartedAt: () => number | null;
    getSecondsLeft: (defaultSeconds: number) => number;
    hasMatchTimeExpired: () => boolean;
    resetRoundFlags: () => void;
    setHitMessage: (message: { targetId: ClientId; text: string }) => void;
    setRoundEndsAt: (value: number) => void;
    setRoundMessage: (message?: string) => void;
    startScenario: () => void;
};

export type RuntimeRoundIntro = {
    clear: () => void;
    complete: () => void;
    start: () => void;
    update: () => void;
};

export type RuntimeParticleLayer = {
    clear: () => void;
    count: () => number;
    render: (context: CanvasRenderingContext2D) => void;
    spawnGunSmoke: (source: RuntimeParticleSource) => void;
    spawnMuzzleFlash: (source: RuntimeParticleSource) => void;
    spawnObstacleHit: (
        source: RuntimeParticleSource & { obstacleId?: string }
    ) => void;
    spawnPlayerHit: (source: RuntimeParticleSource) => void;
    spawnRicochetSparks: (source: RuntimeParticleSource) => void;
    spawnRockChips: (source: RuntimeParticleSource) => void;
    update: (deltaSeconds: number) => void;
};

export type RuntimeParticleSource = {
    facing?: number;
    speedX?: number;
    speedY?: number;
    x: number;
    y: number;
};

export type RuntimeNamedClient = {
    name?: string;
    slot?: number;
};

export type RuntimeScoreClient = RuntimeNamedClient & {
    slot: number;
};

export type RuntimeScoreKeeper = {
    getGameOverMessage: (
        clients?: RuntimeScoreClient[],
        getClientName?: (client: RuntimeScoreClient) => string
    ) => string;
    getScore: (slot: number) => number;
    resetScores: () => void;
    setScores: (scores?: unknown) => boolean;
};

export type RuntimeTimers = {
    clear: (name: string) => void;
    clearMany: (names: string[]) => void;
    has: (name: string) => boolean;
    set: (name: string, callback: () => void, delay: number) => void;
};

export type RuntimePositionSync = {
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

export type RuntimeSystems = {
    ammo: RuntimeAmmo;
    bullets: RuntimeBullets;
    highScores: HighScoreEntry[];
    localReadyRequested: boolean;
    particleLayer: RuntimeParticleLayer;
    players: RuntimePlayers;
    positionSync: RuntimePositionSync;
    roundData: RuntimeRoundData;
    roundIntro: RuntimeRoundIntro;
    roundState: RoundStateValue;
    scene: RuntimeScene;
    scoreKeeper: RuntimeScoreKeeper;
    timers: RuntimeTimers;
};

export type RuntimeScenarioRenderer = {
    findBulletObstacleHit: (
        allBullets: Record<string, RuntimeBullet | null | undefined>,
        scenario?: Scenario | null
    ) => RuntimeObstacleHit | null;
    getObstacleBodies: (scenario?: Scenario | null) => RuntimeObstacleBody[];
    getRockLines: (scenario?: Scenario | null) => RuntimeCollisionLine[];
    render: (scenario?: Scenario | null) => void;
};

export type RuntimeCollisionDebugRenderer = {
    render: (options: {
        obstacleBodies?: RuntimeObstacleBody[];
        players?: Record<string, RuntimePlayer>;
    }) => void;
};

export type RuntimeNameEditor = {
    close: (options?: { submit?: boolean }) => void;
    getState: () => unknown;
    handleKeyEvent: (keyEvent: RuntimeKeyEvent) => false | unknown;
    isActive: () => boolean;
    open: (name?: unknown) => void;
    select: (rowIndex: number, colIndex: number) => void;
    setName: (name: string) => void;
};

export type RuntimeIdentity = {
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

export type RuntimeInputController = {
    isDown?: (key: string) => boolean;
    press: (key: string) => void;
    ready: () => void;
    release: (key: string) => void;
    releaseReady?: () => void;
    setPlayerId?: (playerId: ClientId) => void;
};

export type RuntimeTouchControls = {
    mount: () => boolean;
    update: (state?: RuntimeTouchControlsState) => unknown;
};

export type RuntimeTouchControlsState = {
    aimLevel?: number;
    canPlay?: boolean;
    editing?: boolean;
    gameplay?: boolean;
    highScoresVisible?: boolean;
    playing?: boolean;
    ready?: boolean;
    waiting?: boolean;
};

export type RuntimeSocket = {
    emit: (event: string, payload?: unknown) => void;
};

export type RuntimeClient = RuntimeNamedClient & {
    id: ClientId;
    ready?: boolean;
    slot: number;
};

export type RuntimeGameModel = {
    clients: RuntimeClient[];
    currentScenario?: Scenario | null;
    gameId?: string;
    matchResultId?: string;
    matchState?: string;
    message?: string;
    playerLimit?: number;
    roundNumber?: number;
    scores?: number[];
    status?: string;
};

export type RuntimeJoinedGamePayload = {
    model: RuntimeGameModel;
    playerId: ClientId;
};

export type RuntimeKeyEvent = {
    action: string;
    key: string;
    player?: ClientId;
    shot?: unknown;
};

export type RuntimePlayerPositionPayload = {
    aim: number;
    facing: number;
    frame: number;
    player: ClientId;
    x: number;
    y: number;
};

export type RuntimeObstacleDamagePayload = {
    id: string;
    ownerId: ClientId;
    roundNumber?: number;
};

export type RuntimeObstacleHit = {
    bullet: RuntimeBullet;
    obstacleId: string;
};

export type RuntimePlayerHit = {
    bullet: RuntimeBullet;
    targetId: ClientId;
    winnerId: ClientId;
};

export type RuntimeHitDetectionResult =
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

export type ClientGameBrowser = {
    document?: Document;
    Image?: typeof globalThis.Image;
    window?: Window;
};

export type ClientGameController = {
    start: () => void;
};
