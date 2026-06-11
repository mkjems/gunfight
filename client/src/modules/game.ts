// @ts-nocheck
export function createGame(dependencies, browser = {}) {
    const document = browser.document || globalThis.document;
    const window = browser.window || globalThis.window;
    const Image = browser.Image || globalThis.Image;

    return (function () {
        var canvas,
            context,
            hudCanvas,
            hudContext,
            gameHud,
            lobbyHud,
            gameHudScreen,
            lobbyScreen,
            highScoresScreen,
            nameEditorScreen,
            ammoHudRenderer,
            assets,
            scenarioRenderer,
            collisionDebugRenderer,
            identity,
            nameEditor,
            cameraController,
            camera,
            gameSounds,
            gameLoop,
            scene,
            socket,
            inputController,
            touchControls,
            players,
            bullets,
            roundState,
            latestModel,
            highScores,
            scoreKeeper,
            roundData,
            timers,
            positionSync,
            ammo,
            roundIntro,
            localReadyRequested,
            playerId;
        var RoundState = dependencies.ClientScreens.RoundState;
        var hasStarted = false;

        function initCanvas() {
            var surfaces = dependencies.ClientCanvasSetup.create({
                CanvasTools: dependencies.CanvasTools,
                canvasConfig: dependencies.Config.canvas,
                document: document
            });

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
                createRockPattern: function (image) {
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
            var overlay = dependencies.ClientHudOverlay.create({
                document: document,
                GameHud: dependencies.GameHud,
                HighScoresScreen: dependencies.HighScoresScreen,
                LobbyScreen: dependencies.LobbyScreen,
                NameEditorScreen: dependencies.NameEditorScreen
            });

            gameHud = overlay.gameHud;
            lobbyHud = overlay.lobbyHud;
            gameHudScreen = overlay.gameHudScreen;
            lobbyScreen = overlay.lobbyScreen;
            highScoresScreen = overlay.highScoresScreen;
            nameEditorScreen = overlay.nameEditorScreen;
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
            var systems = dependencies.ClientGameSystems.create({
                Bullet: dependencies.Bullet,
                Bullets: dependencies.Bullets,
                ClientAmmo: dependencies.ClientAmmo,
                ClientRoundState: dependencies.ClientRoundState,
                ClientTimers: dependencies.ClientTimers,
                PlayerPositionSync: dependencies.PlayerPositionSync,
                Players: dependencies.Players,
                RoundIntro: dependencies.RoundIntro,
                Scene: dependencies.Scene,
                ScoreKeeper: dependencies.ScoreKeeper,
                initialRoundState: RoundState.WAITING,
                playRicochet: gameSounds.playRicochet
            });

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

        function setRoundState(nextState) {
            roundState = dependencies.ClientRoundTransition.resolve({
                canTransition: dependencies.ClientScreens.canTransition,
                currentState: roundState,
                nextState: nextState
            });
        }

        function setRoundMessage(message) {
            roundData.setRoundMessage(message);
            renderHud();
        }

        function getPlayerSlot(id) {
            if (!latestModel) {
                return -1;
            }

            return latestModel.clients.findIndex(function (client) {
                return client.id === id;
            });
        }

        function resetAmmo() {
            ammo.reset(latestModel && latestModel.clients);
        }

        function renderHud() {
            dependencies.ClientHudFlow.render({
                ammo: ammo,
                ammoHudRenderer: ammoHudRenderer,
                camera: camera,
                cameraController: cameraController,
                canvas: canvas,
                defaultSeconds: dependencies.Config.game.seconds,
                gameHud: gameHud,
                gameHudScreen: gameHudScreen,
                hudCanvas: hudCanvas,
                hudContext: hudContext,
                lobbyHud: lobbyHud,
                model: latestModel,
                players: players,
                renderLobbyHud: renderLobbyHud,
                roundData: roundData,
                roundState: roundState,
                scoreKeeper: scoreKeeper,
                updateTouchControls: updateTouchControls
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
                Bullet: dependencies.Bullet,
                scenario: getCurrentScenario(),
                scenarioRenderer: scenarioRenderer
            });
        }

        function updateMovementObstacleEnvironment() {
            dependencies.ClientCollisionEnvironment.updateObstacleBodies({
                Obstacles: dependencies.Obstacles,
                roundState: roundState,
                scenario: getCurrentScenario(),
                scenarioRenderer: scenarioRenderer
            });
        }

        function getObstacleDamage(id) {
            return roundData.getObstacleDamage(id);
        }

        function damageObstacle(id) {
            roundData.damageObstacle(id);
        }

        function renderLobbyHud() {
            dependencies.ClientLobbyHudFlow.render({
                canvas: canvas,
                gameHud: gameHud,
                highScores: highScores,
                highScoresScreen: highScoresScreen,
                hudCanvas: hudCanvas,
                isTouchInterface: isTouchInterface,
                lobbyHud: lobbyHud,
                lobbyScreen: lobbyScreen,
                localReadyRequested: localReadyRequested,
                model: latestModel,
                nameEditor: nameEditor,
                nameEditorScreen: nameEditorScreen,
                onNameEditorSelect: function (rowIndex, colIndex) {
                    nameEditor.select(rowIndex, colIndex);
                    renderHud();
                },
                playerId: playerId,
                roundState: roundState
            });
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
                player: players.all[playerId],
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

        function getClientName(client) {
            return dependencies.ClientLobbyViewModel.getClientName(client);
        }

        function getStoredPlayerName() {
            return identity.getStoredPlayerName();
        }

        function submitNameChange(name) {
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

        function syncPlayers(model) {
            var previousModel = latestModel;

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

        function startRoundRitual(options) {
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

        function handleKeyEvent(keyEvent) {
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
                player: players.all[keyEvent.player],
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
            var result = dependencies.ClientHitDetection.check({
                bullets: bullets,
                collision: dependencies.Collision,
                findBulletObstacleHit: findBulletObstacleHit,
                matchTimeExpired: roundData.hasMatchTimeExpired(),
                players: players,
                roundState: roundState
            });

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

        function handleObstacleHit(hit) {
            dependencies.ClientObstacleSync.handleLocalHit({
                applyDamage: applyObstacleDamage,
                hit: hit,
                model: latestModel,
                playerId: playerId,
                socket: socket
            });
        }

        function applyObstacleDamage(data) {
            dependencies.ClientObstacleSync.applyDamage({
                bullets: bullets,
                damageObstacle: damageObstacle,
                data: data,
                model: latestModel,
                playObstacleHit: gameSounds.playObstacleHit
            });
        }

        function handlePlayerHit(hit) {
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

        function endRound(winnerId) {
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
                player: players.all[playerId],
                socket: socket
            });
        }

        function applyRemotePlayerPosition(data) {
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
                player: players.all[playerId]
            });
        }

        function updateTouchControls() {
            dependencies.ClientTouchControlsFlow.update({
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
                onHighScores: function (nextHighScores) {
                    highScores = Array.isArray(nextHighScores)
                        ? nextHighScores
                        : [];
                    renderHud();
                },
                onJoinedGame: function (data) {
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
                initTouchControls: initTouchControls,
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
