GF.Game = (function () {
    var canvas,
        context,
        hudCanvas,
        hudContext,
        gameHud,
        lobbyHud,
        gameHudScreen,
        lobbyScreen,
        lobbyMainElement,
        highScoresScreenElement,
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
    var RoundState = GF.ClientScreens.RoundState;
    var Screen = GF.ClientScreens.Screen;

    function initCanvas() {
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        hudCanvas = document.getElementById('hudCanvas');
        hudContext = hudCanvas.getContext('2d');
        canvas.width = GF.Config.canvas.width;
        canvas.height = GF.Config.canvas.height;
        hudCanvas.width = GF.Config.canvas.width;
        hudCanvas.height = GF.Config.canvas.height;
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
        disableImageSmoothing();
    }

    function initNameEditor() {
        nameEditor = new GF.NameEditor({
            onChange: renderHud,
            onSubmit: submitNameChange
        });
    }

    function initAssets() {
        assets = new GF.ClientAssets({
            Image: Image,
            createRockPattern: function (image) {
                return GF.CanvasTools.createScaledPattern({
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
        gameHud = document.getElementById('gameHud');
        lobbyHud = document.getElementById('lobbyHud');
        gameHudScreen = new GF.GameHud({
            scoreLeft: document.getElementById('scoreLeft'),
            scoreRight: document.getElementById('scoreRight'),
            timer: document.getElementById('roundTimer'),
            roundMessage: document.getElementById('roundMessage'),
            hitMessage: document.getElementById('hitMessage')
        });
        lobbyMainElement = document.getElementById('lobby-main');
        highScoresScreenElement = document.getElementById('highScoresScreen');
        lobbyScreen = new GF.LobbyScreen({
            main: lobbyMainElement,
            highScores: highScoresScreenElement,
            identity: document.getElementById('lobbyIdentity'),
            controls: document.getElementById('lobbyControlsText'),
            controlsSection: getLobbySection(
                document.getElementById('lobbyControlsText')
            ),
            slots: document.getElementById('lobbySlots'),
            editPrompt: document.getElementById('lobbyEditPrompt'),
            editPromptSection: getLobbySection(
                document.getElementById('lobbyEditPrompt')
            ),
            playPrompt: document.getElementById('lobbyPlayPrompt')
        });
        highScoresScreen = new GF.HighScoresScreen({
            lobbyMain: lobbyMainElement,
            screen: highScoresScreenElement,
            table: document.getElementById('highScoresTable'),
            playPrompt: document.getElementById('highScoresPlayPrompt')
        });
        nameEditorScreen = new GF.NameEditorScreen({
            lobbyMain: lobbyMainElement,
            highScores: highScoresScreenElement,
            editor: document.getElementById('nameEditor'),
            value: document.getElementById('nameEditorValue'),
            grid: document.getElementById('nameEditorGrid'),
            help: document.getElementById('nameEditorHelp')
        });
    }

    function initAmmoHudRenderer() {
        ammoHudRenderer = new GF.AmmoHudRenderer({
            context: hudContext,
            sprite: assets.sprites.ammo
        });
    }

    function initCamera() {
        camera = new GF.Camera({
            worldWidth: GF.Config.canvas.width,
            worldHeight: GF.Config.canvas.height,
            screenWidth: GF.Config.canvas.width,
            screenHeight: GF.Config.canvas.height,
            scale: cameraController.getCameraScale()
        });
    }

    function initSoundEffects() {
        gameSounds = new GF.ClientGameSounds({
            soundEffects: new GF.SoundEffects()
        });
    }

    function initCameraController() {
        cameraController = new GF.ClientCameraController({
            window: window
        });
    }

    function initScenarioRenderer() {
        scenarioRenderer = new GF.ScenarioRenderer({
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
        collisionDebugRenderer = new GF.CollisionDebugRenderer(context);
    }

    function initIdentity() {
        identity = new GF.ClientIdentity({
            getClientName: getClientName,
            storage: window.localStorage
        });
    }

    function disableImageSmoothing() {
        GF.CanvasTools.disableImageSmoothing(context);
        GF.CanvasTools.disableImageSmoothing(hudContext);
    }

    function initGameState() {
        scene = new GF.Scene();
        bullets = new GF.Bullets(scene);
        players = new GF.Players(scene, bullets);
        roundIntro = new GF.RoundIntro({
            players: players
        });
        roundState = RoundState.WAITING;
        highScores = [];
        scoreKeeper = new GF.ScoreKeeper();
        roundData = new GF.ClientRoundState();
        timers = new GF.ClientTimers();
        positionSync = new GF.PlayerPositionSync();
        ammo = new GF.ClientAmmo();
        localReadyRequested = false;
        GF.Bullet.onRicochet = gameSounds.playRicochet;
    }

    function initGameLoop() {
        gameLoop = new GF.ClientGameLoop({
            render: renderFrame,
            update: updateFrame
        });
    }

    function setRoundState(nextState) {
        if (!GF.ClientScreens.canTransition(roundState, nextState)) {
            throw new Error(
                'Illegal round state transition: ' +
                    roundState +
                    ' -> ' +
                    nextState
            );
        }

        roundState = nextState;
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
        GF.ClientHudFlow.render({
            ammo: ammo,
            ammoHudRenderer: ammoHudRenderer,
            camera: camera,
            cameraController: cameraController,
            canvas: canvas,
            defaultSeconds: GF.Config.game.seconds,
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
        GF.ClientCollisionEnvironment.updateBulletLines({
            Bullet: GF.Bullet,
            scenario: getCurrentScenario(),
            scenarioRenderer: scenarioRenderer
        });
    }

    function updateMovementObstacleEnvironment() {
        GF.ClientCollisionEnvironment.updateObstacleBodies({
            Obstacles: GF.Obstacles,
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
        GF.ClientLobbyHudFlow.render({
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
        return GF.ClientLobbyViewModel.shouldShowHighScoresScreen({
            localReadyRequested: localReadyRequested,
            model: latestModel
        });
    }

    function getLobbySection(element) {
        if (!element) {
            return null;
        }

        if (element.closest) {
            return element.closest('.lobby-section');
        }

        return element.parentNode;
    }

    function showElement(element, visible) {
        if (element) {
            element.hidden = !visible;
        }
    }

    function isTouchInterface() {
        if (window.location.search.indexOf('touch=1') >= 0) {
            return true;
        }

        return (
            window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        );
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
        return GF.ClientLobbyViewModel.shouldShowLobbyPrompt({
            localReadyRequested: localReadyRequested,
            model: latestModel,
            playerId: playerId
        });
    }

    function isLocalClientReady() {
        return GF.ClientLobbyViewModel.isLocalClientReady({
            localReadyRequested: localReadyRequested,
            model: latestModel,
            playerId: playerId
        });
    }

    function isLocalClientWaiting() {
        return GF.ClientLobbyViewModel.isLocalClientWaiting({
            localReadyRequested: localReadyRequested,
            model: latestModel,
            playerId: playerId
        });
    }

    function getLocalClient() {
        return GF.ClientLobbyViewModel.getLocalClient(latestModel, playerId);
    }

    function getClientName(client) {
        return GF.ClientLobbyViewModel.getClientName(client);
    }

    function getStoredPlayerName() {
        return identity.getStoredPlayerName();
    }

    function submitNameChange(name) {
        GF.ClientNameEditorFlow.submitNameChange({
            name: name,
            socket: socket
        });
    }

    function syncNameEditor() {
        GF.ClientNameEditorFlow.sync({
            client: getLocalClient(),
            identity: identity,
            editor: nameEditor
        });
    }

    function closeNameEditor() {
        GF.ClientNameEditorFlow.close(nameEditor);
    }

    function enterLobbyState() {
        GF.ClientLobbyFlow.enter({
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

        GF.ClientModelUpdateFlow.sync({
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
        GF.ClientLobbyFlow.scheduleAbandonedRequeue({
            socket: socket,
            timers: timers
        });
    }

    function clearAbandonedRequeue() {
        GF.ClientLobbyFlow.clearAbandonedRequeue({
            timers: timers
        });
    }

    function syncStoredPlayerName() {
        identity.syncStoredPlayerName(getLocalClient());
    }

    function startRoundRitual(options) {
        options = options || {};

        GF.ClientRoundRitual.start({
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
        GF.ClientMatchTimer.scheduleEnd({
            endGame: endGame,
            roundData: roundData,
            timers: timers
        });
    }

    function handleKeyEvent(keyEvent) {
        if (
            roundState === RoundState.WAITING &&
            keyEvent.player === playerId &&
            keyEvent.key === 'e' &&
            !isLocalClientWaiting()
        ) {
            return false;
        }

        if (
            roundState === RoundState.WAITING &&
            nameEditor &&
            keyEvent.player === playerId
        ) {
            if (nameEditor.handleKeyEvent(keyEvent) === false) {
                renderHud();
                return false;
            }
        }

        GF.ClientGameplayInput.handle({
            ammo: ammo,
            bullets: bullets,
            keyEvent: keyEvent,
            player: players.all[keyEvent.player],
            roundState: roundState,
            onBulletFired: function () {
                reloadIfBothPlayersAreOutOfAmmo();
                gameSounds.playGun();
                renderHud();
            },
            onEmptyGun: gameSounds.playEmptyGun
        });
    }

    function reloadIfBothPlayersAreOutOfAmmo() {
        GF.ClientAmmoFlow.reloadIfBothPlayersAreOut({
            ammo: ammo,
            model: latestModel,
            roundState: roundState
        });
    }

    function checkForHits() {
        var result = GF.ClientHitDetection.check({
            bullets: bullets,
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
        GF.ClientObstacleSync.handleLocalHit({
            applyDamage: applyObstacleDamage,
            hit: hit,
            model: latestModel,
            playerId: playerId,
            socket: socket
        });
    }

    function applyObstacleDamage(data) {
        GF.ClientObstacleSync.applyDamage({
            bullets: bullets,
            damageObstacle: damageObstacle,
            data: data,
            model: latestModel,
            playObstacleHit: gameSounds.playObstacleHit
        });
    }

    function handlePlayerHit(hit) {
        GF.ClientPlayerHitFlow.handleHit({
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
        GF.ClientPlayerHitFlow.resetAfterHit({
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
        GF.ClientRoundEndFlow.endRound({
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
        GF.ClientRoundEndFlow.endGame({
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
        GF.ClientRoundResetFlow.resetRound({
            bullets: bullets,
            isReadyToStart: GF.ClientModelSync.isReadyToStart,
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
        GF.ClientRoundResetFlow.resetToStartScreen({
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
        GF.ClientFrameFlow.update({
            checkForHits: checkForHits,
            roundIntro: roundIntro,
            scene: scene,
            syncLocalPlayerPosition: syncLocalPlayerPosition,
            updateBulletCollisionEnvironment: updateBulletCollisionEnvironment,
            updateCamera: updateCamera,
            updateMovementObstacleEnvironment: updateMovementObstacleEnvironment
        });
    }

    function renderFrame() {
        GF.ClientFrameFlow.render({
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
        touchControls = new GF.TouchControls({
            input: inputController,
            getAimLevel: getLocalAimLevel
        });
        updateTouchControls();
    }

    function getLocalAimLevel() {
        return GF.ClientTouchControlsFlow.getLocalAimLevel({
            defaultAim: GF.Config.player.defaultAim,
            player: players.all[playerId]
        });
    }

    function updateTouchControls() {
        GF.ClientTouchControlsFlow.update({
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
            obstacleBodies: GF.Obstacles.all(),
            players: players.all
        });
    }

    function start() {
        initCanvas();
        initGameState();

        socket = new GF.ClientNetwork({
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

    function startInputAndAnimation() {
        inputController = GF.ClientInputStartup.start({
            createInputController: function () {
                return new GF.KeysModel(socket, playerId, handleKeyEvent, {
                    canReady: function () {
                        return !nameEditor || !nameEditor.isActive();
                    },
                    onReady: function () {
                        localReadyRequested = true;
                        renderHud();
                    }
                });
            },
            initTouchControls: initTouchControls,
            inputController: inputController,
            startGameLoop: function () {
                initGameLoop();
                gameLoop.start();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', start);

    return {
        start: start
    };
})();
