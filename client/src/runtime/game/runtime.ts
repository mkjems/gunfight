import type { HighScoreEntry, Scenario } from '../../../../shared/contracts.js';
import type { RoundState as RoundStateValue } from '../../state/clientScreens.js';
import type { ClientGameRuntimeModules } from './dependencies.js';
import {
    parseGameModel,
    parseJoinedGamePayload,
    parseKeyEvent,
    parseObstacleDamagePayload,
    parsePlayerPositionPayload
} from './payloadGuards.js';
import type {
    ClientGameController,
    ClientId,
    RuntimeAmmo,
    RuntimeApp,
    RuntimeAssets,
    RuntimeBullet,
    RuntimeBullets,
    RuntimeCamera,
    RuntimeCameraController,
    RuntimeCanvasSurfaces,
    RuntimeCollisionDebugRenderer,
    RuntimeGameLoop,
    RuntimeGameModel,
    RuntimeGameSounds,
    RuntimeHitDetectionResult,
    RuntimeIdentity,
    RuntimeInputController,
    RuntimeInstallPrompt,
    RuntimeKeyEvent,
    RuntimeNameEditor,
    RuntimeNamedClient,
    RuntimeObstacleHit,
    RuntimeParticleLayer,
    RuntimeParticleSource,
    RuntimePlayerHit,
    RuntimePlayers,
    RuntimePositionSync,
    RuntimeRoundData,
    RuntimeRoundIntro,
    RuntimeRenderContext,
    RuntimeScenarioRenderer,
    RuntimeScene,
    RuntimeScoreKeeper,
    RuntimeSocket,
    RuntimeSprite,
    RuntimeSystems,
    RuntimeTimers,
    RuntimeTouchControls,
    RuntimeUi
} from './types.js';

export type ClientGameRuntimeOptions = {
    dependencies: ClientGameRuntimeModules;
    document: Document;
    ImageCtor: typeof globalThis.Image;
    window: Window;
};

export class ClientGameRuntime implements ClientGameController {
    private readonly dependencies: ClientGameRuntimeModules;
    private readonly document: Document;
    private readonly ImageCtor: typeof globalThis.Image;
    private readonly window: Window;
    private readonly RoundState: ClientGameRuntimeModules['ClientScreens']['RoundState'];

    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private hudCanvas!: HTMLCanvasElement;
    private hudContext!: CanvasRenderingContext2D;
    private particleCanvas!: HTMLCanvasElement;
    private particleContext!: CanvasRenderingContext2D;
    private app!: RuntimeApp;
    private installPrompt?: RuntimeInstallPrompt;
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
    private particleLayer!: RuntimeParticleLayer;
    private roundState!: RoundStateValue;
    private latestModel: RuntimeGameModel | null = null;
    private highScores: HighScoreEntry[] = [];
    private highScoresVisible = false;
    private scoreKeeper!: RuntimeScoreKeeper;
    private roundData!: RuntimeRoundData;
    private timers!: RuntimeTimers;
    private positionSync!: RuntimePositionSync;
    private ammo!: RuntimeAmmo;
    private roundIntro!: RuntimeRoundIntro;
    private localReadyRequested = false;
    private playerId: ClientId | null = null;
    private activeScenario: Scenario | null | undefined = undefined;
    private hasStarted = false;
    private lastParticleUpdatedAt: number | null = null;

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
        this.particleCanvas = surfaces.particleCanvas;
        this.particleContext = surfaces.particleContext;
        this.initAssets();
        this.initHudOverlay();
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
            }
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
            playRicochet: this.handleRicochet
        }) as RuntimeSystems;

        this.scene = systems.scene;
        this.bullets = systems.bullets;
        this.particleLayer = systems.particleLayer;
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
                                this.canRequestReady() &&
                                !this.highScoresVisible &&
                                (!this.nameEditor ||
                                    !this.nameEditor.isActive())
                            );
                        },
                        onReady: () => {
                            this.highScoresVisible = false;
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
            app: this.app,
            camera: this.camera,
            cameraController: this.cameraController,
            canvas: this.canvas,
            defaultSeconds: this.dependencies.Config.game.seconds,
            hudCanvas: this.hudCanvas,
            hudContext: this.hudContext,
            model: this.latestModel,
            particleCanvas: this.particleCanvas,
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
            updateParticles: this.updateParticles,
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
            drawParticles: this.drawParticles,
            drawScenario: this.drawScenario,
            particleCanvas: this.particleCanvas,
            particleContext: this.particleContext,
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
        this.inputController?.setPlayerId?.(joinedGame.playerId);
        this.syncPlayers(joinedGame.model);
        this.startInputAndAnimation();
    };

    private onModelUpdate = (data: unknown) => {
        const model = parseGameModel(data);

        if (model && !this.isStaleModel(model)) {
            this.syncPlayers(model);
        }
    };

    private syncPlayers = (model: RuntimeGameModel) => {
        const previousModel = this.latestModel;
        const shouldEnterServerGameOver =
            model.matchState === 'gameOver' &&
            this.roundState !== this.RoundState.WAITING &&
            this.roundState !== this.RoundState.GAME_OVER;

        this.latestModel = model;
        this.scoreKeeper.setScores(model.scores);
        this.syncServerTiming(model);

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

        if (shouldEnterServerGameOver) {
            this.endGame({ notifyServer: false });
        }
    };

    private handleKeyEvent = (keyEvent: RuntimeKeyEvent) => {
        return this.dependencies.ClientKeyEventFlow.handle({
            ammo: this.ammo,
            bullets: this.bullets,
            highScoresVisible: this.shouldShowHighScoresScreen(),
            isLocalClientWaiting: this.isLocalClientWaiting,
            keyEvent,
            nameEditor: this.nameEditor,
            onGunFired: this.handleGunFired,
            onBulletFired: () => {
                this.reloadIfBothPlayersAreOutOfAmmo();
                this.renderHud();
            },
            onEmptyGun: this.gameSounds.playEmptyGun,
            player: this.getPlayer(keyEvent.player),
            playerId: this.playerId ?? undefined,
            renderHud: this.renderHud,
            returnToLobby: this.returnToLobby,
            roundState: this.roundState,
            showHighScores: this.showHighScores
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

    private startRoundRitual = () => {
        this.highScoresVisible = false;
        this.activeScenario = this.latestModel?.currentScenario ?? null;
        this.clearHitPausePresentation();

        this.dependencies.ClientRoundRitual.start({
            bullets: this.bullets,
            closeNameEditor: this.closeNameEditor,
            endGame: this.endGame,
            hasMatchTimeExpired: this.roundData.hasMatchTimeExpired,
            renderHud: this.renderHud,
            resetAmmo: this.resetAmmo,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scheduleMatchEnd: this.scheduleMatchEnd,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            timers: this.timers
        });
    };

    private scheduleMatchEnd = () => {
        if (this.latestModel?.phase) {
            return;
        }

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
            matchTimeExpired: this.shouldUseLocalMatchExpiry(),
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
        this.spawnObstacleHitParticles(hit);

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
        this.spawnPlayerHitParticles(hit);

        if (this.playerId === null) {
            return;
        }

        this.dependencies.ClientPlayerHitFlow.handleHit({
            bullets: this.bullets,
            hit,
            model: this.latestModel,
            playerId: this.playerId,
            players: this.players,
            playPain: this.gameSounds.playPain,
            renderHud: this.renderHud,
            resetAfterHit: this.resetAfterHit,
            roundData: this.roundData,
            setRoundState: this.setRoundState,
            socket: this.socket,
            timers: this.timers
        });
    };

    private resetAfterHit = () => {
        this.dependencies.ClientPlayerHitFlow.resetAfterHit({
            bullets: this.bullets,
            endGame: this.endGame,
            hasMatchTimeExpired: this.roundData.hasMatchTimeExpired,
            model: this.latestModel,
            players: this.players,
            resetAmmo: this.resetAmmo,
            roundData: this.roundData,
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

    private endGame = (options?: { notifyServer?: boolean }) => {
        const serverOwnsLifecycle = !!this.latestModel?.phase;

        this.dependencies.ClientRoundEndFlow.endGame({
            bullets: this.bullets,
            closeNameEditor: this.closeNameEditor,
            getClientName: this.getClientName,
            model: this.latestModel,
            players: this.players,
            renderHud: this.renderHud,
            resetToStartScreen: serverOwnsLifecycle
                ? undefined
                : this.resetToStartScreen,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
            scoreKeeper: this.scoreKeeper,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            socket: this.socket,
            timers: this.timers,
            notifyServer: options?.notifyServer
        });
    };

    private resetRound = () => {
        this.dependencies.ClientRoundResetFlow.resetRound({
            bullets: this.bullets,
            players: this.players,
            renderHud: this.renderHud,
            roundData: this.roundData,
            setRoundMessage: this.setRoundMessage,
            setRoundState: this.setRoundState,
            syncNameEditor: this.syncNameEditor,
            timers: this.timers
        });
    };

    private resetToStartScreen = () => {
        this.clearParticles();
        this.activeScenario = undefined;

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
        this.clearParticles();
        this.activeScenario = undefined;

        this.dependencies.ClientLobbyFlow.enter({
            bullets: this.bullets,
            players: this.players,
            roundData: this.roundData,
            roundIntro: this.roundIntro,
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

    private drawParticles = (context: RuntimeRenderContext) => {
        this.particleLayer.render(context as CanvasRenderingContext2D);
    };

    private updateParticles = () => {
        const now =
            this.window.performance && this.window.performance.now
                ? this.window.performance.now()
                : new Date().getTime();

        if (this.lastParticleUpdatedAt === null) {
            this.lastParticleUpdatedAt = now;
            return;
        }

        this.particleLayer.update((now - this.lastParticleUpdatedAt) / 1000);
        this.lastParticleUpdatedAt = now;
    };

    private clearParticles = () => {
        this.particleLayer.clear();
        this.lastParticleUpdatedAt = null;
    };

    private handleGunFired = (bullet: unknown) => {
        this.gameSounds.playGun();
        const source = this.getParticleSourceFromBullet(
            bullet as Partial<RuntimeBullet>
        );

        if (!source) {
            return;
        }

        this.particleLayer.spawnMuzzleFlash(source);
        this.particleLayer.spawnGunSmoke(source);
    };

    private handleRicochet = (bullet?: Partial<RuntimeBullet>) => {
        this.gameSounds.playRicochet();
        const source = this.getParticleSourceFromBullet(bullet);

        if (!source) {
            return;
        }

        this.particleLayer.spawnRicochetSparks(source);
        this.particleLayer.spawnRockChips(source);
    };

    private spawnObstacleHitParticles = (hit: RuntimeObstacleHit) => {
        const source = this.getParticleSourceFromBullet(hit.bullet);

        if (!source) {
            return;
        }

        this.particleLayer.spawnObstacleHit({
            ...source,
            obstacleId: hit.obstacleId
        });
    };

    private spawnPlayerHitParticles = (hit: RuntimePlayerHit) => {
        const source = this.getParticleSourceFromBullet(hit.bullet);

        if (source) {
            this.particleLayer.spawnPlayerHit(source);
        }
    };

    private getParticleSourceFromBullet = (
        bullet?: Partial<RuntimeBullet> | null
    ): RuntimeParticleSource | null => {
        if (
            !bullet ||
            typeof bullet.x !== 'number' ||
            typeof bullet.y !== 'number'
        ) {
            return null;
        }

        return {
            facing: bullet.facing,
            speedX: bullet.speedX,
            speedY: bullet.speedY,
            x: bullet.x,
            y: bullet.y
        };
    };

    private updateTouchControls = () => {
        return this.dependencies.ClientTouchControlsFlow.update({
            aimLevel: this.getLocalAimLevel(),
            editing: this.nameEditor && this.nameEditor.isActive(),
            canPlay: this.canRequestReady(),
            highScoresVisible: this.shouldShowHighScoresScreen(),
            ready: this.isLocalClientReady(),
            roundState: this.roundState,
            touchControls: this.touchControls
        });
    };

    private getLobbyHudState = () => {
        return this.dependencies.ClientLobbyHudFlow.getState({
            highScores: this.highScores,
            highScoresVisible: this.shouldShowHighScoresScreen(),
            isTouchInterface: this.isTouchInterface,
            localReadyRequested: this.localReadyRequested,
            model: this.latestModel,
            nameEditor: this.nameEditor,
            onNameEditorSelect: (rowIndex: number, colIndex: number) => {
                this.nameEditor.select(rowIndex, colIndex);
                this.renderHud();
            },
            playerId: this.playerId,
            players: this.players.all,
            roundState: this.roundState
        });
    };

    private getInstallPromptProps = () => {
        return this.installPrompt && this.installPrompt.getProps
            ? this.installPrompt.getProps()
            : undefined;
    };

    private getCurrentScenario = () => {
        if (this.activeScenario !== undefined) {
            return this.activeScenario;
        }

        return this.latestModel && this.latestModel.currentScenario;
    };

    private findBulletObstacleHit = () => {
        return this.scenarioRenderer.findBulletObstacleHit(
            this.bullets.all(),
            this.getCurrentScenario()
        );
    };

    private isStaleModel = (model: RuntimeGameModel) => {
        if (
            !this.latestModel ||
            !model.gameId ||
            model.gameId !== this.latestModel.gameId ||
            typeof model.version !== 'number' ||
            typeof this.latestModel.version !== 'number'
        ) {
            return false;
        }

        return model.version <= this.latestModel.version;
    };

    private syncServerTiming = (model: RuntimeGameModel) => {
        if (typeof model.matchEndsAt === 'number') {
            this.roundData.setRoundEndsAt(model.matchEndsAt);
            return;
        }

        if (model.phase) {
            this.roundData.setRoundEndsAt(null);
        }
    };

    private shouldUseLocalMatchExpiry = () => {
        if (this.latestModel?.phase) {
            return false;
        }

        return this.roundData.hasMatchTimeExpired();
    };

    private clearHitPausePresentation = () => {
        this.roundData.clearHitMessage();

        Object.keys(this.players.all).forEach((id) => {
            this.players.all[id]?.clearDeathAnimation();
        });
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
                highScoresVisible: this.highScoresVisible,
                localReadyRequested: this.localReadyRequested,
                model: this.latestModel,
                playerId: this.playerId
            }
        );
    };

    private showHighScores = () => {
        this.highScoresVisible = true;
    };

    private returnToLobby = () => {
        this.highScoresVisible = false;
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

    private canRequestReady = () => {
        return this.dependencies.ClientLobbyViewModel.canLocalClientReady({
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
