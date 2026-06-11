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
        ammoSprite,
        wagonSprite,
        cactusSprite,
        saloonSprite,
        rockPatternSprite,
        rockPattern,
        scenarioRenderer,
        nameEditor,
        camera,
        soundEffects,
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
    var playerNameStorageKey = 'gunfight-player-name';
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
        ammoSprite = new Image();
        ammoSprite.onload = renderHud;
        ammoSprite.src = 'images/bullet.png';
        wagonSprite = new Image();
        wagonSprite.src = 'images/wagon-1-4-37x38.png';
        cactusSprite = new Image();
        cactusSprite.src = 'images/cactus-1-4-17X32.png';
        saloonSprite = new Image();
        saloonSprite.src = 'images/saloon-64x128.png';
        rockPatternSprite = new Image();
        rockPatternSprite.onload = function () {
            rockPattern = createScaledPattern(rockPatternSprite);
        };
        rockPatternSprite.src = 'images/rock-pattern.png';
        initHudOverlay();
        initSoundEffects();
        initScenarioRenderer();
        initNameEditor();
        initCamera();
        disableImageSmoothing();
    }

    function initNameEditor() {
        nameEditor = new GF.NameEditor({
            onChange: renderHud,
            onSubmit: submitNameChange
        });
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

    function initCamera() {
        camera = new GF.Camera({
            worldWidth: GF.Config.canvas.width,
            worldHeight: GF.Config.canvas.height,
            screenWidth: GF.Config.canvas.width,
            screenHeight: GF.Config.canvas.height,
            scale: getCameraScale()
        });
    }

    function initSoundEffects() {
        soundEffects = new GF.SoundEffects();
    }

    function initScenarioRenderer() {
        scenarioRenderer = new GF.ScenarioRenderer({
            context: context,
            getObstacleDamage: getObstacleDamage,
            getRockPattern: function () {
                return rockPattern;
            },
            getScenarioStartedAt: function () {
                return roundData.getScenarioStartedAt();
            },
            sprites: {
                cactus: cactusSprite,
                saloon: saloonSprite,
                wagon: wagonSprite
            }
        });
    }

    function disableImageSmoothing() {
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        hudContext.imageSmoothingEnabled = false;
        hudContext.webkitImageSmoothingEnabled = false;
        hudContext.mozImageSmoothingEnabled = false;
        hudContext.msImageSmoothingEnabled = false;
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
        ammo = {};
        localReadyRequested = false;
        GF.Bullet.onRicochet = playRicochetSound;
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

    function playGunSound() {
        playSoundEffect('gunshot');
    }

    function playEmptyGunSound() {
        playSoundEffect('emptyGun');
    }

    function playRicochetSound() {
        playSoundEffect('ricochet');
    }

    function playPainSound() {
        playSoundEffect('pain');
    }

    function playReadySound() {
        playSoundEffect('ready');
    }

    function playObstacleHitSound(id) {
        if (id === 'wagon') {
            playSoundEffect('wagonHit');
            return;
        }

        if (id && id.indexOf('cactus:') === 0) {
            playSoundEffect('cactusHit');
        }
    }

    function playSoundEffect(name) {
        if (soundEffects) {
            soundEffects.play(name);
        }
    }

    function createScaledPattern(image) {
        var scale = GF.Config.graphics.scale;
        var tile = document.createElement('canvas');
        var tileContext = tile.getContext('2d');

        tile.width = image.width * scale;
        tile.height = image.height * scale;
        tileContext.imageSmoothingEnabled = false;
        tileContext.webkitImageSmoothingEnabled = false;
        tileContext.mozImageSmoothingEnabled = false;
        tileContext.msImageSmoothingEnabled = false;
        tileContext.drawImage(image, 0, 0, tile.width, tile.height);

        return context.createPattern(tile, 'repeat');
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
        ammo = {};

        if (!latestModel) {
            return;
        }

        latestModel.clients.forEach(function (client) {
            ammo[client.id] = GF.Config.round.ammo;
        });
    }

    function renderHud() {
        var secondsLeft = GF.Config.game.seconds;
        var firstClient;
        var secondClient;
        var firstAmmo;
        var secondAmmo;

        secondsLeft = roundData.getSecondsLeft(secondsLeft);

        if (roundState === RoundState.GAME_OVER) {
            secondsLeft = 'GAME OVER';
        }

        hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

        if (roundState === RoundState.WAITING) {
            renderLobbyHud();
            updateTouchControls();
            return;
        }

        showElement(canvas, true);
        showElement(hudCanvas, true);
        showElement(gameHud, true);
        showElement(lobbyHud, false);

        firstClient = latestModel && latestModel.clients[0];
        secondClient = latestModel && latestModel.clients[1];

        if (!firstClient || !secondClient) {
            renderGameHud(secondsLeft);
            return;
        }

        firstAmmo = ammo[firstClient.id] || 0;
        secondAmmo = ammo[secondClient.id] || 0;

        renderGameHud(secondsLeft);
        drawAmmo(firstAmmo, 122, 606, 1);
        drawAmmo(secondAmmo, 828, 606, -1);
        updateTouchControls();
    }

    function renderGameHud(secondsLeft) {
        gameHudScreen.render({
            leftScore: scoreKeeper.getScore(0),
            rightScore: scoreKeeper.getScore(1),
            timerLabel: secondsLeft,
            roundMessage: roundData.getRoundMessage(),
            hitMessage: getHitHudMessage()
        });
    }

    function getHitHudMessage() {
        var hitMessage = roundData.getHitMessage();
        var target;
        var point;

        if (!hitMessage) {
            return null;
        }

        target = players.all[hitMessage.targetId];

        if (!target) {
            return null;
        }

        point = worldToHudPoint(target.x, Math.max(80, target.y - 150));

        return {
            text: hitMessage.text,
            x: point.x,
            y: point.y
        };
    }

    function worldToHudPoint(x, y) {
        if (shouldUseCamera()) {
            return {
                x: (x - camera.x) * camera.scale,
                y: (y - camera.y) * camera.scale
            };
        }

        return {
            x: x,
            y: y
        };
    }

    function drawAmmo(count, x, y, direction) {
        var i;
        var roundX;
        var scale = GF.Config.graphics.scale;
        var spriteWidth = 7 * scale;
        var spriteHeight = 16 * scale;
        var spacing = 10 * scale;

        hudContext.save();
        hudContext.fillStyle = GF.Config.colors.yellow;
        hudContext.shadowColor = 'rgb(0,0,0)';
        hudContext.shadowOffsetX = 3;
        hudContext.shadowOffsetY = 3;

        for (i = 0; i < count; i++) {
            roundX = x + i * spacing * direction;

            if (ammoSprite && ammoSprite.complete) {
                hudContext.drawImage(
                    ammoSprite,
                    roundX,
                    y,
                    spriteWidth,
                    spriteHeight
                );
            } else {
                hudContext.fillRect(roundX, y, spriteWidth, spriteHeight);
            }
        }

        hudContext.restore();
    }

    function getCurrentScenario() {
        return latestModel && latestModel.currentScenario;
    }

    function drawScenario() {
        scenarioRenderer.render(getCurrentScenario());
    }

    function updateBulletCollisionEnvironment() {
        GF.Bullet.setCollisionLines(
            scenarioRenderer.getRockLines(getCurrentScenario())
        );
    }

    function updateMovementObstacleEnvironment() {
        var scenario =
            roundState === RoundState.WAITING ? null : getCurrentScenario();

        GF.Obstacles.setBodies(scenarioRenderer.getObstacleBodies(scenario));
    }

    function getObstacleDamage(id) {
        return roundData.getObstacleDamage(id);
    }

    function damageObstacle(id) {
        roundData.damageObstacle(id);
    }

    function renderLobbyHud() {
        var isTouch = isTouchInterface();
        var activeScreen = getActiveScreen();
        var controls = [
            'h j k l - left down up right',
            'a z - aim up down',
            'Space - shoot'
        ];
        showElement(gameHud, false);
        showElement(lobbyHud, true);

        if (activeScreen === Screen.LOBBY_EDIT_NAME) {
            renderNameEditor();
            return;
        }

        showElement(canvas, true);
        showElement(hudCanvas, true);
        nameEditorScreen.hide();

        if (activeScreen === Screen.HIGH_SCORES) {
            renderHighScoresScreen(isTouch);
            return;
        }

        lobbyScreen.render({
            identityLines: [getLobbyPlayerLabel(), getGameLabel()],
            controls: isTouch ? [] : controls,
            showControls: !isTouch,
            slots: getLobbySlotViewModels(),
            showEditPrompt: !isTouch && isLocalClientWaiting(),
            editPrompt:
                !isTouch && isLocalClientWaiting()
                    ? 'PRESS E TO EDIT NAME'
                    : '',
            playPrompt:
                shouldShowLobbyPrompt() && !isTouch ? 'PRESS P TO PLAY' : ''
        });
    }

    function getActiveScreen() {
        return GF.ClientScreens.getActiveScreen({
            roundState: roundState,
            nameEditorActive: nameEditor && nameEditor.isActive(),
            highScoresVisible: shouldShowHighScoresScreen()
        });
    }

    function shouldShowHighScoresScreen() {
        var clients = (latestModel && latestModel.clients) || [];
        var hasReadyClient = clients.some(function (client) {
            return client.ready;
        });

        if (hasReadyClient || localReadyRequested) {
            return false;
        }

        return Math.floor(new Date().getTime() / 7000) % 2 === 1;
    }

    function renderHighScoresScreen(isTouch) {
        highScoresScreen.render({
            rows: highScores && highScores.length ? highScores : [],
            playPrompt:
                shouldShowLobbyPrompt() && !isTouch ? 'PRESS P TO PLAY' : ''
        });
    }

    function renderNameEditor() {
        var state = nameEditor.getState();
        var helpLines = isTouchInterface()
            ? []
            : ['H J K L MOVE', 'SPACE SELECT', 'E DONE'];

        showElement(canvas, false);
        showElement(hudCanvas, false);
        lobbyScreen.clear();
        nameEditorScreen.render({
            state: state,
            helpLines: helpLines,
            onSelect: function (rowIndex, colIndex) {
                nameEditor.select(rowIndex, colIndex);
                renderHud();
            }
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
        if (!camera || roundState === RoundState.WAITING) {
            return false;
        }

        if (window.location.search.indexOf('camera=1') >= 0) {
            return true;
        }

        return (
            window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        );
    }

    function getCameraScale() {
        var queryScale = getQueryNumber('cameraScale');

        if (queryScale) {
            return queryScale;
        }

        if (window.location.search.indexOf('camera=1') >= 0) {
            return 1.85;
        }

        if (
            window.matchMedia &&
            window.matchMedia('(pointer: coarse)').matches
        ) {
            return 1.15;
        }

        return 1;
    }

    function getQueryNumber(name) {
        var match = new RegExp('[?&]' + name + '=([^&]+)').exec(
            window.location.search
        );
        var value = match ? parseFloat(decodeURIComponent(match[1])) : 0;

        return isNaN(value) ? 0 : value;
    }

    function updateCamera() {
        var visibleScreen;
        var player;

        if (!camera) {
            return;
        }

        camera.setScreenSize(canvas.width, canvas.height);
        visibleScreen = getVisibleCanvasScreen();
        camera.setVisibleScreen(
            visibleScreen.x,
            visibleScreen.y,
            visibleScreen.width,
            visibleScreen.height
        );
        camera.setScale(getCameraScale());

        if (!shouldUseCamera()) {
            camera.reset();
            return;
        }

        player = players.all[playerId];
        camera.follow(player);
    }

    function getVisibleCanvasScreen() {
        var rect = canvas.getBoundingClientRect();
        var visibleLeft = Math.max(0, rect.left);
        var visibleTop = Math.max(0, rect.top);
        var visibleRight = Math.min(
            window.innerWidth || rect.right,
            rect.right
        );
        var visibleBottom = Math.min(
            window.innerHeight || rect.bottom,
            rect.bottom
        );
        var scaleX = rect.width ? canvas.width / rect.width : 1;
        var scaleY = rect.height ? canvas.height / rect.height : 1;

        return {
            x: Math.max(0, (visibleLeft - rect.left) * scaleX),
            y: Math.max(0, (visibleTop - rect.top) * scaleY),
            width: Math.max(1, (visibleRight - visibleLeft) * scaleX),
            height: Math.max(1, (visibleBottom - visibleTop) * scaleY)
        };
    }

    function shouldShowLobbyPrompt() {
        return (
            (!latestModel || latestModel.status !== 'abandoned') &&
            !isLocalClientReady()
        );
    }

    function isLocalClientReady() {
        var client = getLocalClient();

        return localReadyRequested || !!(client && client.ready);
    }

    function isLocalClientWaiting() {
        var client = getLocalClient();

        return !!(
            client &&
            !isLocalClientReady() &&
            latestModel &&
            latestModel.status !== 'abandoned'
        );
    }

    function getLobbyPlayerLabel() {
        var client = getLocalClient();
        var playerIndex;

        if (!latestModel || !client) {
            return '';
        }

        playerIndex = (latestModel.clients || []).findIndex(function (item) {
            return item.id === playerId;
        });

        return 'PLAYER ' + (playerIndex + 1) + ' - ' + getClientName(client);
    }

    function getLocalClient() {
        return GF.ClientModelSync.getLocalClient(latestModel, playerId);
    }

    function getGameLabel() {
        if (!latestModel || !latestModel.gameId) {
            return '';
        }

        return 'GAME ' + latestModel.gameId;
    }

    function getClientName(client) {
        return client.name || 'PLAYER ' + ((client.slot || 0) + 1);
    }

    function getStoredPlayerName() {
        try {
            return window.localStorage.getItem(playerNameStorageKey) || '';
        } catch (error) {
            return '';
        }
    }

    function storePlayerName(name) {
        if (!name) {
            return;
        }

        try {
            window.localStorage.setItem(playerNameStorageKey, name);
        } catch (error) {}
    }

    function submitNameChange(name) {
        if (!socket) {
            return;
        }

        socket.emit('updateName', {
            name: name || ''
        });
    }

    function syncNameEditor() {
        var client;

        if (!nameEditor || nameEditor.isActive()) {
            return;
        }

        client = getLocalClient();

        if (client) {
            storePlayerName(getClientName(client));
            nameEditor.setName(getClientName(client));
        }
    }

    function closeNameEditor() {
        if (nameEditor && nameEditor.isActive()) {
            nameEditor.close();
        }
    }

    function getLobbySlots() {
        var slots = [];
        var model = latestModel || {};
        var clients = model.clients || [];
        var playerLimit = model.playerLimit || Math.max(2, clients.length);
        var i;

        for (i = 0; i < playerLimit; i++) {
            slots.push(clients[i] || null);
        }

        return slots;
    }

    function getLobbySlotViewModels() {
        return getLobbySlots().map(function (client, index) {
            return {
                label: getLobbySlotLabel(client, index),
                ready: !!(client && client.ready)
            };
        });
    }

    function getLobbySlotLabel(client, index) {
        var opponentMessage;

        if (!client) {
            opponentMessage = getOpponentSlotMessage();

            if (opponentMessage) {
                return 'PLAYER ' + (index + 1) + ' : ' + opponentMessage;
            }

            return 'PLAYER ' + (index + 1) + ' : WAITING';
        }

        return (
            'PLAYER ' +
            (index + 1) +
            ' - ' +
            getClientName(client) +
            ' : ' +
            (client.ready ? 'READY' : 'WAITING')
        );
    }

    function getOpponentSlotMessage() {
        var message = getLobbyMessage();

        return isOpponentSlotMessage(message) ? message : '';
    }

    function isOpponentSlotMessage(message) {
        return (
            message === 'LOOKING FOR CHALLENGER' || message === 'OPPONENT LEFT'
        );
    }

    function getLobbyMessage() {
        if (latestModel && latestModel.message) {
            return latestModel.message;
        }

        return '';
    }

    function enterLobbyState() {
        timers.clearMany(['ritual', 'hit', 'reset', 'abandonedRequeue']);

        roundIntro.clear();
        roundData.resetRoundFlags();
        setRoundState(RoundState.WAITING);
        scoreKeeper.resetRecordedResult();
        players.clearKeys();
        bullets.clear();
        syncNameEditor();
    }

    function syncPlayers(model) {
        var previousModel = latestModel;
        var syncState;

        latestModel = model;
        syncState = GF.ClientModelSync.analyze(previousModel, model, playerId);

        if (syncState.clearLocalReadyRequest) {
            localReadyRequested = false;
        }

        syncStoredPlayerName();

        if (syncState.abandoned) {
            enterLobbyState();
            scheduleAbandonedRequeue();
        } else {
            clearAbandonedRequeue();
        }

        if (syncState.clientBecameReady) {
            playReadySound();
        }

        players.sync(model, {
            resetChangedSlots: roundState === RoundState.WAITING,
            slots: getCurrentPlayerSlots()
        });
        syncNameEditor();

        if (roundState === RoundState.WAITING && syncState.readyToStart) {
            startRoundRitual({ resetScores: true });
            return;
        }

        renderHud();
    }

    function scheduleAbandonedRequeue() {
        if (timers.has('abandonedRequeue') || !socket) {
            return;
        }

        timers.set(
            'abandonedRequeue',
            function () {
                socket.emit('requeue');
            },
            GF.Config.round.abandonedRequeueDelay
        );
    }

    function clearAbandonedRequeue() {
        timers.clear('abandonedRequeue');
    }

    function syncStoredPlayerName() {
        var client = getLocalClient();

        if (client) {
            storePlayerName(getClientName(client));
        }
    }

    function getCurrentPlayerSlots() {
        return roundState === RoundState.WAITING
            ? GF.Config.player.lobbySlots
            : GF.Config.player.slots;
    }

    function isReadyToStart(model) {
        return GF.ClientModelSync.isReadyToStart(model);
    }

    function startRoundRitual(options) {
        options = options || {};
        var getReadyDelay = Math.max(
            GF.Config.round.getReadyDelay,
            GF.Config.round.introWalkDelay
        );

        if (options.resetScores) {
            scoreKeeper.resetScores();
            roundData.clearRoundEnd();
        }

        setRoundState(RoundState.RITUAL);
        closeNameEditor();
        roundData.startScenario();
        roundData.clearObstacleDamage();
        bullets.reset();
        resetAmmo();
        roundIntro.start();
        setRoundMessage('GET READY');
        renderHud();

        timers.set(
            'ritual',
            function () {
                if (hasMatchTimeExpired()) {
                    endGame();
                    return;
                }

                roundIntro.complete();
                setRoundMessage('DRAW!');

                timers.set(
                    'ritual',
                    function () {
                        if (hasMatchTimeExpired()) {
                            endGame();
                            return;
                        }

                        setRoundMessage('');
                        if (!roundData.getRoundEndsAt()) {
                            roundData.setRoundEndsAt(
                                new Date().getTime() +
                                    GF.Config.game.seconds * 1000
                            );
                            scheduleMatchEnd();
                        }
                        resetAmmo();
                        setRoundState(RoundState.PLAYING);
                        renderHud();
                    },
                    GF.Config.round.drawDelay
                );
            },
            getReadyDelay
        );
    }

    function hasMatchTimeExpired() {
        return roundData.hasMatchTimeExpired();
    }

    function scheduleMatchEnd() {
        var delay;

        if (!roundData.getRoundEndsAt()) {
            return;
        }

        delay = Math.max(0, roundData.getRoundEndsAt() - new Date().getTime());
        timers.set(
            'matchEnd',
            function () {
                endGame();
            },
            delay
        );
    }

    function handleKeyEvent(keyEvent) {
        var player;

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

        player = players.all[keyEvent.player];

        if (!player) {
            return;
        }

        if (
            roundState === RoundState.RITUAL ||
            roundState === RoundState.ROUND_OVER ||
            roundState === RoundState.HIT_PAUSE ||
            roundState === RoundState.GAME_OVER
        ) {
            if (keyEvent.action === 'up') {
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if (keyEvent.key === ' ' && keyEvent.action === 'down') {
            var bullet;

            if (
                roundState === RoundState.PLAYING &&
                ammo[player.playerId] > 0
            ) {
                bullet = bullets.fire(player, keyEvent.shot);
            } else if (roundState === RoundState.PLAYING) {
                playEmptyGunSound();
            }

            if (bullet) {
                ammo[player.playerId]--;
                reloadIfBothPlayersAreOutOfAmmo();
                playGunSound();

                if (!keyEvent.shot) {
                    keyEvent.shot = bullet.toSnapshot();
                }

                renderHud();
            }
            return;
        }

        player.respondToKeyEvent(keyEvent);
    }

    function reloadIfBothPlayersAreOutOfAmmo() {
        var clients;

        if (roundState !== RoundState.PLAYING || !latestModel) {
            return;
        }

        clients = latestModel.clients || [];

        if (clients.length < 2) {
            return;
        }

        if (
            clients.every(function (client) {
                return (ammo[client.id] || 0) <= 0;
            })
        ) {
            resetAmmo();
        }
    }

    function checkForHits() {
        var hit;
        var obstacleHit;

        if (roundState !== RoundState.PLAYING) {
            if (roundState === RoundState.HIT_PAUSE && hasMatchTimeExpired()) {
                endGame();
            }
            return;
        }

        obstacleHit = findBulletObstacleHit();

        if (obstacleHit) {
            obstacleHit.bullet.deleteMe = true;
            handleObstacleHit(obstacleHit);
            return;
        }

        hit = GF.Collision.findBulletHit(bullets.all(), players.all);

        if (hit) {
            hit.bullet.deleteMe = true;
            handlePlayerHit(hit);
        }

        if (hasMatchTimeExpired()) {
            endGame();
        }
    }

    function findBulletObstacleHit() {
        return scenarioRenderer.findBulletObstacleHit(
            bullets.all(),
            getCurrentScenario()
        );
    }

    function handleObstacleHit(hit) {
        if (hit.bullet.ownerId !== playerId) {
            return;
        }

        applyObstacleDamage({
            id: hit.obstacleId,
            ownerId: hit.bullet.ownerId,
            roundNumber: latestModel && latestModel.roundNumber
        });
        socket.emit('obstacleDamage', {
            id: hit.obstacleId,
            ownerId: hit.bullet.ownerId,
            roundNumber: latestModel && latestModel.roundNumber
        });
    }

    function applyObstacleDamage(data) {
        if (latestModel && data.roundNumber !== latestModel.roundNumber) {
            return;
        }

        damageObstacle(data.id);
        playObstacleHitSound(data.id);
        bullets.remove(data.ownerId);
    }

    function handlePlayerHit(hit) {
        var winnerSlot = getPlayerSlot(hit.winnerId);
        var target = players.all[hit.targetId];

        setRoundState(RoundState.HIT_PAUSE);
        roundData.setHitMessage({
            targetId: hit.targetId,
            text: 'Got me!'
        });
        playPainSound();

        if (target) {
            target.playDeathAnimation();
        }

        scoreKeeper.addPoint(winnerSlot);

        roundData.setAdvanceRoundAfterHit(hit.winnerId === playerId);

        renderHud();
        players.clearKeys();
        bullets.clear();

        timers.set('hit', resetAfterHit, GF.Config.round.resetDelay);
    }

    function resetAfterHit() {
        roundData.clearHitMessage();
        clearPlayerDeathAnimations();

        if (hasMatchTimeExpired()) {
            endGame();
            return;
        }

        if (roundData.consumeAdvanceRoundAfterHit()) {
            socket.emit('advanceRound');
        }

        bullets.reset();
        resetAmmo();
        startRoundRitual({ resetScores: false });
    }

    function clearPlayerDeathAnimations() {
        Object.keys(players.all).forEach(function (id) {
            players.all[id].clearDeathAnimation();
        });
    }

    function endRound(winnerId) {
        var winnerSlot = getPlayerSlot(winnerId);

        setRoundState(RoundState.ROUND_OVER);
        closeNameEditor();
        roundData.clearRoundPauseFlags();

        if (winnerSlot >= 0) {
            scoreKeeper.addPoint(winnerSlot);
            setRoundMessage('PLAYER ' + players.label(winnerId) + ' WINS');
        } else {
            setRoundMessage('TIME');
        }

        renderHud();
        players.clearKeys();
        bullets.clear();

        timers.clearMany(['reset', 'matchEnd', 'ritual', 'hit']);

        roundIntro.clear();

        timers.set('reset', resetRound, GF.Config.round.resetDelay);
    }

    function endGame() {
        setRoundState(RoundState.GAME_OVER);
        closeNameEditor();
        recordGameResult();
        roundData.resetRoundFlags();
        setRoundMessage(
            scoreKeeper.getGameOverMessage(
                latestModel && latestModel.clients,
                getClientName
            )
        );
        renderHud();
        players.clearKeys();
        bullets.clear();

        timers.clearMany(['reset', 'matchEnd', 'ritual', 'hit']);

        roundIntro.clear();

        timers.set('reset', resetToStartScreen, GF.Config.round.gameOverDelay);
    }

    function recordGameResult() {
        var result;

        if (!socket) {
            return;
        }

        result = scoreKeeper.createGameResult(latestModel, getClientName);

        if (!result) {
            return;
        }

        socket.emit('recordGameResult', result);
    }

    function resetRound() {
        var readyToStart = latestModel && isReadyToStart(latestModel);

        players.resetAll({
            slots: readyToStart
                ? GF.Config.player.slots
                : GF.Config.player.lobbySlots
        });
        bullets.reset();
        setRoundMessage('');
        roundData.resetRoundFlags();
        timers.clearMany(['reset', 'matchEnd']);

        if (readyToStart) {
            startRoundRitual({ resetScores: false });
            return;
        }

        setRoundState(RoundState.WAITING);
        syncNameEditor();
        renderHud();
    }

    function resetToStartScreen() {
        players.resetAll({
            slots: GF.Config.player.lobbySlots
        });
        bullets.reset();
        resetAmmo();
        setRoundMessage('');
        roundData.resetRoundFlags();
        timers.clearMany(['reset', 'matchEnd']);
        setRoundState(RoundState.WAITING);
        syncNameEditor();
        renderHud();
        socket.emit('resetReady');
    }

    function animate() {
        updateBulletCollisionEnvironment();
        updateMovementObstacleEnvironment();
        scene.moveAll();
        roundIntro.update();
        syncLocalPlayerPosition();
        checkForHits();
        updateCamera();

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        if (shouldUseCamera()) {
            camera.apply(context);
        }
        if (roundState !== RoundState.WAITING) {
            drawScenario();
        }
        scene.drawAll(context);
        drawCollisionBodies();
        context.restore();
        renderHud();
        updateTouchControls();

        setTimeout(function () {
            requestAnimFrame(animate);
        }, 0);
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
        var player = players.all[playerId];

        if (player && typeof player.getAim === 'function') {
            return player.getAim();
        }

        return GF.Config.player.defaultAim;
    }

    function updateTouchControls() {
        if (!touchControls) {
            return;
        }

        touchControls.update({
            gameplay: shouldShowGameplayTouchControls(),
            waiting: roundState === RoundState.WAITING,
            playing: roundState === RoundState.PLAYING,
            editing: nameEditor && nameEditor.isActive(),
            highScoresVisible:
                roundState === RoundState.WAITING &&
                shouldShowHighScoresScreen(),
            ready: isLocalClientReady(),
            aimLevel: getLocalAimLevel()
        });
    }

    function shouldShowGameplayTouchControls() {
        return (
            roundState === RoundState.RITUAL ||
            roundState === RoundState.PLAYING ||
            roundState === RoundState.HIT_PAUSE ||
            roundState === RoundState.ROUND_OVER
        );
    }

    function drawCollisionBodies() {
        if (!GF.Config.debug.showCollisionBodies) {
            return;
        }

        drawCollisionBodyShapes(GF.Obstacles.all(), 'rgba(255, 80, 80, 0.75)');

        Object.keys(players.all).forEach(function (id) {
            drawCircles(
                players.all[id].getCollisionCircles(),
                'rgba(80, 180, 255, 0.8)'
            );
        });
    }

    function drawCollisionBodyShapes(bodies, color) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        bodies.forEach(function (body) {
            if (body.type === 'rect') {
                context.strokeRect(body.x, body.y, body.width, body.height);
                return;
            }

            if (body.type === 'polygon') {
                drawPolygonPath(body.points);
                return;
            }

            drawCirclePath(body);
        });

        context.restore();
    }

    function drawCircles(circles, color) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        circles.forEach(function (circle) {
            drawCirclePath(circle);
        });

        context.restore();
    }

    function drawCirclePath(circle) {
        context.beginPath();
        context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        context.stroke();
    }

    function drawPolygonPath(points) {
        if (!points.length) {
            return;
        }

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(function (point) {
            context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.stroke();
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
        if (!inputController) {
            inputController = new GF.KeysModel(
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
            initTouchControls();
            animate();
        }
    }

    document.addEventListener('DOMContentLoaded', start);

    return {
        start: start
    };
})();
