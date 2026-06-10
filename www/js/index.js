GF.Game = (function(){
    var canvas,
        context,
        hudCanvas,
        hudContext,
        hudOverlay,
        gameHud,
        lobbyHud,
        scoreLeftElement,
        scoreRightElement,
        roundTimerElement,
        roundMessageElement,
        hitMessageElement,
        lobbyIdentityElement,
        lobbyMainElement,
        lobbyControlsElement,
        lobbyControlsSectionElement,
        lobbySlotsElement,
        lobbyEditPromptElement,
        lobbyEditPromptSectionElement,
        lobbyPlayPromptElement,
        highScoresScreenElement,
        highScoresTableElement,
        highScoresPlayPromptElement,
        nameEditorElement,
        nameEditorValueElement,
        nameEditorGridElement,
        nameEditorHelpElement,
        ammoSprite,
        wagonSprite,
        cactusSprite,
        saloonSprite,
        rockPatternSprite,
        rockPattern,
        nameEditor,
        camera,
        soundEffects,
        audioContext,
        scene,
        socket,
        inputController,
        touchControls,
        players,
        bullets,
        roundState,
        latestModel,
        highScores,
        scores,
        ammo,
        roundEndsAt,
        roundMessageText,
        hitMessage,
        ritualTimer,
        hitTimer,
        resetTimer,
        abandonedRequeueTimer,
        scenarioStartedAt,
        roundIntro,
        advanceRoundAfterHit,
        lastPositionSyncAt,
        obstacleDamage,
        lastRecordedResultId,
        localReadyRequested,
        playerId;
    var playerNameStorageKey = 'gunfight-player-name';

    function initCanvas(){
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
        rockPatternSprite.onload = function(){
            rockPattern = createScaledPattern(rockPatternSprite);
        };
        rockPatternSprite.src = 'images/rock-pattern.png';
        initHudOverlay();
        initSoundEffects();
        initNameEditor();
        initCamera();
        disableImageSmoothing();
    }

    function initNameEditor(){
        nameEditor = new GF.NameEditor({
            onChange: renderHud,
            onSubmit: submitNameChange
        });
    }

    function initHudOverlay(){
        hudOverlay = document.getElementById('hudOverlay');
        gameHud = document.getElementById('gameHud');
        lobbyHud = document.getElementById('lobbyHud');
        scoreLeftElement = document.getElementById('scoreLeft');
        scoreRightElement = document.getElementById('scoreRight');
        roundTimerElement = document.getElementById('roundTimer');
        roundMessageElement = document.getElementById('roundMessage');
        hitMessageElement = document.getElementById('hitMessage');
        lobbyIdentityElement = document.getElementById('lobbyIdentity');
        lobbyMainElement = document.getElementById('lobby-main');
        lobbyControlsElement = document.getElementById('lobbyControlsText');
        lobbyControlsSectionElement = getLobbySection(lobbyControlsElement);
        lobbySlotsElement = document.getElementById('lobbySlots');
        lobbyEditPromptElement = document.getElementById('lobbyEditPrompt');
        lobbyEditPromptSectionElement = getLobbySection(lobbyEditPromptElement);
        lobbyPlayPromptElement = document.getElementById('lobbyPlayPrompt');
        highScoresScreenElement = document.getElementById('highScoresScreen');
        highScoresTableElement = document.getElementById('highScoresTable');
        highScoresPlayPromptElement = document.getElementById('highScoresPlayPrompt');
        nameEditorElement = document.getElementById('nameEditor');
        nameEditorValueElement = document.getElementById('nameEditorValue');
        nameEditorGridElement = document.getElementById('nameEditorGrid');
        nameEditorHelpElement = document.getElementById('nameEditorHelp');
    }

    function initCamera(){
        camera = new GF.Camera({
            worldWidth: GF.Config.canvas.width,
            worldHeight: GF.Config.canvas.height,
            screenWidth: GF.Config.canvas.width,
            screenHeight: GF.Config.canvas.height,
            scale: getCameraScale()
        });
    }

    function initSoundEffects(){
        soundEffects = {
            gunshot: createSoundEffect('sounds/gunshot.m4a', 0.8, 5),
            emptyGun: createSoundEffect('sounds/empty-gun-shot.mp3', 0.8, 3),
            pain: createSoundEffect('sounds/pain.m4a', 0.8, 3),
            ricochet: createSoundEffect('sounds/ricochet.mp3', 0.7, 5),
            ready: createSoundEffect('sounds/ready.mp3', 0.8, 3),
            cactusHit: createSoundEffect('sounds/cactus-hit.m4a', 0.8, 3),
            wagonHit: createSoundEffect('sounds/wagon-hit.mp3', 0.8, 3)
        };
        bindSoundWarmup();
    }

    function createSoundEffect(src, volume, poolSize){
        var sound = {
            src: src,
            buffer: null,
            fallbackPool: createFallbackAudioPool(src, volume, poolSize),
            loading: null,
            nextIndex: 0,
            volume: volume
        };

        loadSoundBuffer(sound);

        return sound;
    }

    function createFallbackAudioPool(src, volume, poolSize){
        var pool = [];
        var i;

        for(i = 0; i < poolSize; i++){
            pool.push(createAudioElement(src, volume));
        }

        return pool;
    }

    function createAudioElement(src, volume){
        var audio = new Audio(src);

        audio.preload = 'auto';
        audio.volume = volume;
        audio.load();

        return audio;
    }

    function getAudioContext(){
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if(!AudioContextClass){
            return null;
        }

        if(!audioContext){
            audioContext = new AudioContextClass();
        }

        return audioContext;
    }

    function loadSoundBuffer(sound){
        var context = getAudioContext();

        if(!context || !window.fetch || sound.loading){
            return;
        }

        sound.loading = fetch(sound.src)
            .then(function(response){
                if(!response.ok){
                    throw new Error('Could not load sound: ' + sound.src);
                }

                return response.arrayBuffer();
            })
            .then(function(arrayBuffer){
                return decodeAudioBuffer(context, arrayBuffer);
            })
            .then(function(buffer){
                sound.buffer = buffer;
            })
            .catch(function(){});
    }

    function decodeAudioBuffer(context, arrayBuffer){
        return new Promise(function(resolve, reject){
            var decodeResult = context.decodeAudioData(arrayBuffer, resolve, reject);

            if(decodeResult && decodeResult.then){
                decodeResult.then(resolve).catch(reject);
            }
        });
    }

    function bindSoundWarmup(){
        document.addEventListener('keydown', warmSoundEffects, { once: true, capture: true });
        document.addEventListener('pointerdown', warmSoundEffects, { once: true, capture: true });
    }

    function warmSoundEffects(){
        var context = getAudioContext();

        resumeAudioContext(context);

        Object.keys(soundEffects || {}).forEach(function(name){
            loadSoundBuffer(soundEffects[name]);
            soundEffects[name].fallbackPool.forEach(warmAudioElement);
        });
    }

    function warmAudioElement(audio){
        var warmupAudio = audio.cloneNode();
        var playRequest;

        warmupAudio.muted = true;
        warmupAudio.currentTime = 0;
        playRequest = warmupAudio.play();

        if(playRequest && playRequest.then){
            playRequest.then(function(){
                warmupAudio.pause();
                warmupAudio.currentTime = 0;
            }).catch(function(){});
        } else {
            warmupAudio.pause();
            warmupAudio.currentTime = 0;
        }
    }

    function resumeAudioContext(context){
        var resumeRequest;

        if(!context || context.state !== 'suspended' || !context.resume){
            return;
        }

        resumeRequest = context.resume();

        if(resumeRequest && resumeRequest.catch){
            resumeRequest.catch(function(){});
        }
    }

    function disableImageSmoothing(){
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        hudContext.imageSmoothingEnabled = false;
        hudContext.webkitImageSmoothingEnabled = false;
        hudContext.mozImageSmoothingEnabled = false;
        hudContext.msImageSmoothingEnabled = false;
    }

    function initGameState(){
        scene = new GF.Scene();
        bullets = new GF.Bullets(scene);
        players = new GF.Players(scene, bullets);
        roundState = 'waiting';
        highScores = [];
        scores = [0, 0];
        ammo = {};
        roundEndsAt = null;
        roundMessageText = '';
        hitMessage = null;
        ritualTimer = null;
        hitTimer = null;
        resetTimer = null;
        abandonedRequeueTimer = null;
        scenarioStartedAt = null;
        roundIntro = null;
        advanceRoundAfterHit = false;
        lastPositionSyncAt = 0;
        obstacleDamage = {};
        lastRecordedResultId = null;
        localReadyRequested = false;
        GF.Bullet.onRicochet = playRicochetSound;
    }

    function playGunSound(){
        playSoundEffect('gunshot');
    }

    function playEmptyGunSound(){
        playSoundEffect('emptyGun');
    }

    function playRicochetSound(){
        playSoundEffect('ricochet');
    }

    function playPainSound(){
        playSoundEffect('pain');
    }

    function playReadySound(){
        playSoundEffect('ready');
    }

    function playObstacleHitSound(id){
        if(id === 'wagon'){
            playSoundEffect('wagonHit');
            return;
        }

        if(id && id.indexOf('cactus:') === 0){
            playSoundEffect('cactusHit');
        }
    }

    function playSoundEffect(name){
        var sound = soundEffects && soundEffects[name];
        var context;
        var source;
        var gain;

        if(!sound){
            return;
        }

        context = getAudioContext();

        if(context && sound.buffer){
            resumeAudioContext(context);

            source = context.createBufferSource();
            gain = context.createGain();
            source.buffer = sound.buffer;
            gain.gain.value = sound.volume;
            source.connect(gain);
            gain.connect(context.destination);
            source.start(0);
            return;
        }

        playFallbackSoundEffect(sound);
    }

    function playFallbackSoundEffect(sound){
        var audio;
        var playRequest;

        if(!sound.fallbackPool.length){
            return;
        }

        audio = sound.fallbackPool[sound.nextIndex];
        sound.nextIndex = (sound.nextIndex + 1) % sound.fallbackPool.length;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = sound.volume;
        playRequest = audio.play();

        if(playRequest && playRequest.catch){
            playRequest.catch(function(){});
        }
    }

    function createScaledPattern(image){
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

    function setRoundMessage(message){
        roundMessageText = message;
        renderHud();
    }

    function getPlayerSlot(id){
        if(!latestModel){
            return -1;
        }

        return latestModel.clients.findIndex(function(client){
            return client.id === id;
        });
    }

    function resetAmmo(){
        ammo = {};

        if(!latestModel){
            return;
        }

        latestModel.clients.forEach(function(client){
            ammo[client.id] = GF.Config.round.ammo;
        });
    }

    function renderHud(){
        var secondsLeft = GF.Config.round.seconds;
        var firstClient;
        var secondClient;
        var firstAmmo;
        var secondAmmo;

        if(roundEndsAt){
            secondsLeft = Math.max(0, Math.ceil((roundEndsAt - new Date().getTime()) / 1000));
        }

        if(roundState === 'gameOver'){
            secondsLeft = 'GAME OVER';
        }

        hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

        if(roundState === 'waiting'){
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

        if(!firstClient || !secondClient){
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

    function renderGameHud(secondsLeft){
        setText(scoreLeftElement, scores[0] || 0);
        setText(scoreRightElement, scores[1] || 0);
        setText(roundTimerElement, secondsLeft);
        setText(roundMessageElement, roundMessageText || '');
        renderHitMessage();
    }

    function renderHitMessage(){
        var target;
        var point;

        if(!hitMessage || !hitMessageElement){
            showElement(hitMessageElement, false);
            return;
        }

        target = players.all[hitMessage.targetId];

        if(!target){
            showElement(hitMessageElement, false);
            return;
        }

        point = worldToHudPoint(target.x, Math.max(80, target.y - 150));
        setText(hitMessageElement, hitMessage.text);
        hitMessageElement.style.left = (point.x / GF.Config.canvas.width * 100) + '%';
        hitMessageElement.style.top = (point.y / GF.Config.canvas.height * 100) + '%';
        showElement(hitMessageElement, true);
    }

    function worldToHudPoint(x, y){
        if(shouldUseCamera()){
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

    function drawAmmo(count, x, y, direction){
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

        for(i = 0; i < count; i++){
            roundX = x + (i * spacing * direction);

            if(ammoSprite && ammoSprite.complete){
                hudContext.drawImage(ammoSprite, roundX, y, spriteWidth, spriteHeight);
            } else {
                hudContext.fillRect(roundX, y, spriteWidth, spriteHeight);
            }
        }

        hudContext.restore();
    }

    function getCurrentScenario(){
        return latestModel && latestModel.currentScenario;
    }

    function drawScenario(){
        var scenario = getCurrentScenario();

        if(!scenario){
            return;
        }

        drawDecorations(scenario);

        (scenario.cacti || []).forEach(function(cactus, index){
            drawCactus(cactus.x, cactus.y, getObstacleDamage(getCactusId(index)));
        });

        drawRocks(scenario);

        if(scenario.wagon){
            drawWagon(scenario.wagon);
        }
    }

    function drawDecorations(scenario){
        (scenario.decorations || []).forEach(function(decoration){
            if(decoration.type === 'saloon'){
                drawSaloon(decoration.x, decoration.y);
            }
        });
    }

    function drawSaloon(x, y){
        var scale = GF.Config.graphics.scale;
        var width = 64 * scale;
        var height = 128 * scale;

        if(!saloonSprite || !saloonSprite.complete){
            return;
        }

        context.drawImage(saloonSprite, x, y, width, height);
    }

    function drawRocks(scenario){
        if(!scenario){
            return;
        }

        (scenario.rocks || []).forEach(function(rock){
            var lines = rock.lines || [];
            var firstLine = lines[0];

            if(!firstLine){
                return;
            }

            context.save();
            context.fillStyle = rockPattern || GF.Config.colors.yellow;
            context.shadowColor = 'rgb(0,0,0)';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.beginPath();
            context.moveTo(rock.x + firstLine.from[0], rock.y + firstLine.from[1]);

            lines.forEach(function(line){
                context.lineTo(rock.x + line.to[0], rock.y + line.to[1]);
            });

            context.closePath();
            context.fill();
            context.restore();
        });
    }

    function getRockLines(scenario){
        var lines = [];

        if(!scenario){
            return lines;
        }

        (scenario.rocks || []).forEach(function(rock){
            (rock.lines || []).forEach(function(line){
                lines.push({
                    x1: rock.x + line.from[0],
                    y1: rock.y + line.from[1],
                    x2: rock.x + line.to[0],
                    y2: rock.y + line.to[1]
                });
            });
        });

        return lines;
    }

    function updateBulletCollisionEnvironment(){
        GF.Bullet.setCollisionLines(getRockLines(getCurrentScenario()));
    }

    function updateMovementObstacleEnvironment(){
        var scenario = roundState === 'waiting' ? null : getCurrentScenario();

        GF.Obstacles.setBodies(getObstacleBodies(scenario));
    }

    function getObstacleBodies(scenario){
        var bodies = [];
        var scale = GF.Config.graphics.scale;

        if(!scenario){
            return bodies;
        }

        (scenario.cacti || []).forEach(function(cactus, index){
            var body = getCactusBody(cactus, index);

            if(body){
                bodies.push(body);
            }
        });

        (scenario.rocks || []).forEach(function(rock){
            bodies.push(getRockPolygonBody(rock));
        });

        if(scenario.wagon){
            getWagonObstacleCircles(scenario.wagon).forEach(function(circle){
                bodies.push(circle);
            });
        }

        return bodies;
    }

    function getRockPolygonBody(rock){
        return {
            type: 'polygon',
            points: getRockPolygonPoints(rock)
        };
    }

    function getRockPolygonPoints(rock){
        return (rock.lines || []).map(function(line){
            return {
                x: rock.x + line.from[0],
                y: rock.y + line.from[1]
            };
        });
    }

    function getWagonObstacleCircles(wagon){
        var position = getWagonPosition(wagon);
        var scale = GF.Config.graphics.scale;
        var colliders = [
            { x: -7, y: 7, radius: 9 },
            { x: 7, y: 7, radius: 9 },
            { x: 0, y: -10, radius: 10 }
        ];

        return colliders.map(function(collider){
            return {
                type: 'circle',
                id: 'wagon',
                damage: getObstacleDamage('wagon'),
                x: position.x + (collider.x * scale),
                y: position.y + (collider.y * scale),
                radius: collider.radius * scale
            };
        });
    }

    function getCactusBody(cactus, index){
        var scale = GF.Config.graphics.scale;
        var damage = getCactusDamageStage(index);
        var width = 5 * scale;
        var heights = [29, 22, 15, 0];
        var height = heights[damage] * scale;

        if(!height){
            return null;
        }

        return {
            type: 'rect',
            id: getCactusId(index),
            damage: damage,
            x: cactus.x - (width / 2),
            y: cactus.y - height,
            width: width,
            height: height
        };
    }

    function getCactusId(index){
        return 'cactus:' + index;
    }

    function getCactusDamageStage(index){
        return Math.min(3, getObstacleDamage(getCactusId(index)));
    }

    function getObstacleDamage(id){
        return obstacleDamage[id] || 0;
    }

    function damageObstacle(id){
        obstacleDamage[id] = getObstacleDamage(id) + 1;
    }

    function drawCactus(x, y, damage){
        var scale = GF.Config.graphics.scale;
        var sourceWidth = 17;
        var sourceHeight = 32;
        var frame = Math.min(3, damage);
        var width = sourceWidth * scale;
        var height = sourceHeight * scale;

        context.save();

        if(cactusSprite && cactusSprite.complete){
            context.drawImage(
                cactusSprite,
                frame * sourceWidth,
                0,
                sourceWidth,
                sourceHeight,
                x - (width / 2),
                y - height,
                width,
                height
            );
        } else {
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(x - (width / 2), y - height, width, height);
        }

        context.restore();
    }

    function drawWagon(wagon){
        var position = getWagonPosition(wagon);
        var scale = GF.Config.graphics.scale;
        var sourceWidth = 37;
        var sourceHeight = 38;
        var damage = Math.min(3, getObstacleDamage('wagon'));
        var width = sourceWidth * scale;
        var height = sourceHeight * scale;

        context.save();

        if(wagonSprite && wagonSprite.complete){
            context.drawImage(
                wagonSprite,
                damage * sourceWidth,
                0,
                sourceWidth,
                sourceHeight,
                position.x - (width / 2),
                position.y - (height / 2),
                width,
                height
            );
        } else {
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(position.x - (width / 2), position.y - (height / 2), width, height);
        }

        context.restore();
    }

    function getWagonPosition(wagon){
        var elapsed = scenarioStartedAt ? new Date().getTime() - scenarioStartedAt : 0;
        var duration = wagon.duration || 10000;
        var progress = Math.min(1, Math.max(0, elapsed / duration));

        return {
            x: wagon.x,
            y: wagon.fromY + ((wagon.toY - wagon.fromY) * progress)
        };
    }

    function renderLobbyHud(){
        var isTouch = isTouchInterface();
        var controls = [
            'h j k l - left down up right',
            'a z - aim up down',
            'Space - shoot'
        ];
        showElement(gameHud, false);
        showElement(lobbyHud, true);

        if(nameEditor && nameEditor.isActive()){
            renderNameEditor();
            return;
        }

        showElement(canvas, true);
        showElement(hudCanvas, true);
        showElement(nameEditorElement, false);

        if(shouldShowHighScoresScreen()){
            renderHighScoresScreen(isTouch);
            return;
        }

        showElement(lobbyMainElement, true);
        showElement(highScoresScreenElement, false);
        setLines(lobbyIdentityElement, [
            getLobbyPlayerLabel(),
            getGameLabel()
        ]);
        showElement(lobbyControlsSectionElement, !isTouch);
        setLines(lobbyControlsElement, isTouch ? [] : controls);
        setLines(lobbySlotsElement, getLobbySlots().map(function(client, index){
            return getLobbySlotLabel(client, index);
        }));
        showElement(lobbyEditPromptSectionElement, !isTouch && isLocalClientWaiting());
        setText(lobbyEditPromptElement, !isTouch && isLocalClientWaiting() ? 'PRESS E TO EDIT NAME' : '');

        showElement(lobbyPlayPromptElement, true);
        setText(lobbyPlayPromptElement, shouldShowLobbyPrompt() && !isTouch ? 'PRESS P TO PLAY' : '');
    }

    function shouldShowHighScoresScreen(){
        var clients = latestModel && latestModel.clients || [];
        var hasReadyClient = clients.some(function(client){
            return client.ready;
        });

        if(hasReadyClient || localReadyRequested){
            return false;
        }

        return Math.floor(new Date().getTime() / 7000) % 2 === 1;
    }

    function renderHighScoresScreen(isTouch){
        showElement(lobbyMainElement, false);
        showElement(highScoresScreenElement, true);
        renderHighScoresTable();
        setText(highScoresPlayPromptElement, shouldShowLobbyPrompt() && !isTouch ? 'PRESS P TO PLAY' : '');
    }

    function renderHighScoresTable(){
        var rows = highScores && highScores.length ? highScores : [];
        var key = rows.map(function(row){
            return [row.name, row.wins, row.kills, row.deaths].join(':');
        }).join('|');

        if(!highScoresTableElement){
            return;
        }

        if(highScoresTableElement.dataset.highScoresKey === key){
            return;
        }

        highScoresTableElement.dataset.highScoresKey = key;
        highScoresTableElement.innerHTML = '';
        appendHighScoreRow(['NAME', 'WINS', 'KILLS', 'DEATHS'], true);

        if(!rows.length){
            var emptyRow = document.createElement('div');

            emptyRow.className = 'high-score-empty';
            emptyRow.textContent = 'NO SCORES YET';
            highScoresTableElement.appendChild(emptyRow);
            return;
        }

        rows.forEach(function(row){
            appendHighScoreRow([row.name, row.wins, row.kills, row.deaths], false);
        });
    }

    function appendHighScoreRow(values, isHeader){
        var rowElement;

        if(!highScoresTableElement){
            return;
        }

        rowElement = document.createElement('div');
        rowElement.className = 'high-score-row' + (isHeader ? ' is-header' : '');
        values.forEach(function(value){
            var cell = document.createElement('span');

            cell.textContent = value;
            rowElement.appendChild(cell);
        });
        highScoresTableElement.appendChild(rowElement);
    }

    function renderNameEditor(){
        var state = nameEditor.getState();
        var helpLines = isTouchInterface() ? [] : [
            'H J K L MOVE',
            'SPACE SELECT',
            'E DONE'
        ];

        showElement(canvas, false);
        showElement(hudCanvas, false);
        showElement(lobbyMainElement, false);
        showElement(highScoresScreenElement, false);
        setLines(lobbyIdentityElement, []);
        setLines(lobbyControlsElement, []);
        setLines(lobbySlotsElement, []);
        setText(lobbyEditPromptElement, '');
        setText(lobbyPlayPromptElement, '');
        showElement(lobbyPlayPromptElement, false);
        showElement(nameEditorElement, true);
        setText(nameEditorValueElement, 'NAME: ' + (state.name || ' '));
        setLines(nameEditorHelpElement, helpLines);
        renderNameEditorGrid(state);
    }

    function renderNameEditorGrid(state){
        var gridKey;

        if(!nameEditorGridElement){
            return;
        }

        gridKey = state.cursorRow + ':' + state.cursorCol;

        if(nameEditorGridElement.dataset.gridKey === gridKey){
            return;
        }

        nameEditorGridElement.dataset.gridKey = gridKey;
        nameEditorGridElement.innerHTML = '';

        state.grid.forEach(function(row, rowIndex){
            var rowElement = document.createElement('div');

            rowElement.className = 'name-editor-row' + (row.length < 9 ? ' is-short' : '');

            row.forEach(function(value, colIndex){
                var button = document.createElement('button');

                button.type = 'button';
                button.className = 'name-editor-key' + (state.cursorRow === rowIndex && state.cursorCol === colIndex ? ' is-selected' : '');
                button.textContent = value;
                button.addEventListener('pointerdown', function(evt){
                    evt.preventDefault();
                    nameEditor.select(rowIndex, colIndex);
                    renderHud();
                });
                rowElement.appendChild(button);
            });

            nameEditorGridElement.appendChild(rowElement);
        });
    }

    function setText(element, text){
        if(!element){
            return;
        }

        element.textContent = typeof text === 'undefined' || text === null ? '' : String(text);
    }

    function setLines(element, lines){
        var key;

        if(!element){
            return;
        }

        key = lines.filter(function(line){
            return line;
        }).join('\n');

        if(element.dataset.linesKey === key){
            return;
        }

        element.dataset.linesKey = key;
        element.innerHTML = '';
        key.split('\n').filter(function(line){
            return line;
        }).forEach(function(line){
            var lineElement = document.createElement('div');

            lineElement.textContent = line;
            element.appendChild(lineElement);
        });
    }

    function getLobbySection(element){
        if(!element){
            return null;
        }

        if(element.closest){
            return element.closest('.lobby-section');
        }

        return element.parentNode;
    }

    function showElement(element, visible){
        if(element){
            element.hidden = !visible;
        }
    }

    function isTouchInterface(){
        if(window.location.search.indexOf('touch=1') >= 0){
            return true;
        }

        return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    }

    function shouldUseCamera(){
        if(!camera || roundState === 'waiting'){
            return false;
        }

        if(window.location.search.indexOf('camera=1') >= 0){
            return true;
        }

        return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    }

    function getCameraScale(){
        var queryScale = getQueryNumber('cameraScale');

        if(queryScale){
            return queryScale;
        }

        if(window.location.search.indexOf('camera=1') >= 0){
            return 1.85;
        }

        if(window.matchMedia && window.matchMedia('(pointer: coarse)').matches){
            return 1.15;
        }

        return 1;
    }

    function getQueryNumber(name){
        var match = new RegExp('[?&]' + name + '=([^&]+)').exec(window.location.search);
        var value = match ? parseFloat(decodeURIComponent(match[1])) : 0;

        return isNaN(value) ? 0 : value;
    }

    function updateCamera(){
        var visibleScreen;
        var player;

        if(!camera){
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

        if(!shouldUseCamera()){
            camera.reset();
            return;
        }

        player = players.all[playerId];
        camera.follow(player);
    }

    function getVisibleCanvasScreen(){
        var rect = canvas.getBoundingClientRect();
        var visibleLeft = Math.max(0, rect.left);
        var visibleTop = Math.max(0, rect.top);
        var visibleRight = Math.min(window.innerWidth || rect.right, rect.right);
        var visibleBottom = Math.min(window.innerHeight || rect.bottom, rect.bottom);
        var scaleX = rect.width ? canvas.width / rect.width : 1;
        var scaleY = rect.height ? canvas.height / rect.height : 1;

        return {
            x: Math.max(0, (visibleLeft - rect.left) * scaleX),
            y: Math.max(0, (visibleTop - rect.top) * scaleY),
            width: Math.max(1, (visibleRight - visibleLeft) * scaleX),
            height: Math.max(1, (visibleBottom - visibleTop) * scaleY)
        };
    }

    function shouldShowLobbyPrompt(){
        return (!latestModel || latestModel.status !== 'abandoned') && !isLocalClientReady();
    }

    function isLocalClientReady(){
        var client = getLocalClient();

        return localReadyRequested || !!(client && client.ready);
    }

    function isLocalClientWaiting(){
        var client = getLocalClient();

        return !!(client && !isLocalClientReady() && latestModel && latestModel.status !== 'abandoned');
    }

    function getLobbyPlayerLabel(){
        var client = getLocalClient();
        var playerIndex;

        if(!latestModel || !client){
            return '';
        }

        playerIndex = (latestModel.clients || []).findIndex(function(item){
            return item.id === playerId;
        });

        return 'PLAYER ' + (playerIndex + 1) + ' - ' + getClientName(client);
    }

    function getLocalClient(){
        var model = latestModel;

        if(!model){
            return null;
        }

        return (model.clients || []).find(function(client){
            return client.id === playerId;
        }) || null;
    }

    function getGameLabel(){
        if(!latestModel || !latestModel.gameId){
            return '';
        }

        return 'GAME ' + latestModel.gameId;
    }

    function getClientName(client){
        return client.name || ('PLAYER ' + ((client.slot || 0) + 1));
    }

    function getStoredPlayerName(){
        try {
            return window.localStorage.getItem(playerNameStorageKey) || '';
        } catch(error){
            return '';
        }
    }

    function storePlayerName(name){
        if(!name){
            return;
        }

        try {
            window.localStorage.setItem(playerNameStorageKey, name);
        } catch(error){}
    }

    function submitNameChange(name){
        if(!socket){
            return;
        }

        socket.emit('updateName', {
            name: name || ''
        });
    }

    function syncNameEditor(){
        var client;

        if(!nameEditor || nameEditor.isActive()){
            return;
        }

        client = getLocalClient();

        if(client){
            storePlayerName(getClientName(client));
            nameEditor.setName(getClientName(client));
        }
    }

    function closeNameEditor(){
        if(nameEditor && nameEditor.isActive()){
            nameEditor.close();
        }
    }

    function getLobbySlots(){
        var slots = [];
        var model = latestModel || {};
        var clients = model.clients || [];
        var playerLimit = model.playerLimit || Math.max(2, clients.length);
        var i;

        for(i = 0; i < playerLimit; i++){
            slots.push(clients[i] || null);
        }

        return slots;
    }

    function getLobbySlotLabel(client, index){
        var opponentMessage;

        if(!client){
            opponentMessage = getOpponentSlotMessage();

            if(opponentMessage){
                return 'PLAYER ' + (index + 1) + ' : ' + opponentMessage;
            }

            return 'PLAYER ' + (index + 1) + ' : WAITING';
        }

        return 'PLAYER ' + (index + 1) + ' - ' + getClientName(client) + ' : ' + (client.ready ? 'READY' : 'WAITING');
    }

    function getOpponentSlotMessage(){
        var message = getLobbyMessage();

        return isOpponentSlotMessage(message) ? message : '';
    }

    function isOpponentSlotMessage(message){
        return message === 'LOOKING FOR CHALLENGER' || message === 'OPPONENT LEFT';
    }

    function getLobbyMessage(){
        if(latestModel && latestModel.message){
            return latestModel.message;
        }

        return '';
    }

    function enterLobbyState(){
        if(ritualTimer){
            clearTimeout(ritualTimer);
            ritualTimer = null;
        }

        if(hitTimer){
            clearTimeout(hitTimer);
            hitTimer = null;
        }

        if(resetTimer){
            clearTimeout(resetTimer);
            resetTimer = null;
        }

        if(abandonedRequeueTimer){
            clearTimeout(abandonedRequeueTimer);
            abandonedRequeueTimer = null;
        }

        roundIntro = null;
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
        roundState = 'waiting';
        lastRecordedResultId = null;
        players.clearKeys();
        bullets.clear();
        syncNameEditor();
    }

    function syncPlayers(model){
        var previousModel = latestModel;

        latestModel = model;
        syncLocalReadyRequest();
        syncStoredPlayerName();

        if(model.status === 'abandoned'){
            enterLobbyState();
            scheduleAbandonedRequeue();
        } else {
            clearAbandonedRequeue();
        }

        if(didAnyClientBecomeReady(previousModel, model)){
            playReadySound();
        }

        players.sync(model, {
            resetChangedSlots: roundState === 'waiting'
        });
        syncNameEditor();

        if(roundState === 'waiting' && isReadyToStart(model)){
            startRoundRitual({ resetScores: true });
            return;
        }

        renderHud();
    }

    function scheduleAbandonedRequeue(){
        if(abandonedRequeueTimer || !socket){
            return;
        }

        abandonedRequeueTimer = setTimeout(function(){
            abandonedRequeueTimer = null;
            socket.emit('requeue');
        }, GF.Config.round.abandonedRequeueDelay);
    }

    function clearAbandonedRequeue(){
        if(!abandonedRequeueTimer){
            return;
        }

        clearTimeout(abandonedRequeueTimer);
        abandonedRequeueTimer = null;
    }

    function syncStoredPlayerName(){
        var client = getLocalClient();

        if(client){
            storePlayerName(getClientName(client));
        }
    }

    function syncLocalReadyRequest(){
        var client = getLocalClient();

        if(client && !client.ready){
            localReadyRequested = false;
        }
    }

    function didAnyClientBecomeReady(previousModel, model){
        var previousReady = {};

        if(!previousModel || !model){
            return false;
        }

        (previousModel.clients || []).forEach(function(client){
            previousReady[client.id] = client.ready;
        });

        return (model.clients || []).some(function(client){
            return client.ready && !previousReady[client.id];
        });
    }

    function isReadyToStart(model){
        return model.clients.length >= 2 && model.clients.every(function(client){
            return client.ready;
        });
    }

    function startRoundRitual(options){
        options = options || {};
        var getReadyDelay = Math.max(GF.Config.round.getReadyDelay, GF.Config.round.introWalkDelay);

        if(options.resetScores){
            scores = [0, 0];
        }

        roundState = 'ritual';
        closeNameEditor();
        roundEndsAt = null;
        scenarioStartedAt = new Date().getTime();
        obstacleDamage = {};
        bullets.reset();
        resetAmmo();
        startRoundIntro();
        setRoundMessage('GET READY');
        renderHud();

        if(ritualTimer){
            clearTimeout(ritualTimer);
        }

        ritualTimer = setTimeout(function(){
            completeRoundIntro();
            setRoundMessage('DRAW!');

            ritualTimer = setTimeout(function(){
                ritualTimer = null;
                setRoundMessage('');
                roundEndsAt = new Date().getTime() + (GF.Config.round.seconds * 1000);
                resetAmmo();
                roundState = 'playing';
                renderHud();
            }, GF.Config.round.drawDelay);
        }, getReadyDelay);
    }

    function startRoundIntro(){
        var startedAt = new Date().getTime();
        var duration = GF.Config.round.introWalkDelay;
        var targets = [];

        players.clearKeys();

        Object.keys(players.all).forEach(function(id){
            var player = players.all[id];
            var slot = GF.Config.player.slots[player.slot % GF.Config.player.slots.length];
            var bounds;

            player.resetTo(slot);
            bounds = player.getBounds();

            targets.push({
                player: player,
                fromX: slot.facing > 0 ? bounds.minX : bounds.maxX,
                fromY: slot.y,
                toX: slot.x,
                toY: slot.y,
                idleFrame: slot.frame
            });
        });

        roundIntro = {
            startedAt: startedAt,
            duration: duration,
            targets: targets
        };

        updateRoundIntro();
    }

    function updateRoundIntro(){
        var elapsed;
        var progress;
        var eased;

        if(!roundIntro){
            return;
        }

        elapsed = new Date().getTime() - roundIntro.startedAt;
        progress = Math.min(1, Math.max(0, elapsed / roundIntro.duration));
        eased = 1 - Math.pow(1 - progress, 3);

        roundIntro.targets.forEach(function(target){
            var player = target.player;

            player.x = target.fromX + ((target.toX - target.fromX) * eased);
            player.y = target.fromY + ((target.toY - target.fromY) * eased);
            player.frame = player.animationFrames[
                Math.floor(elapsed / (player.animationFrameTime * 1000)) % player.animationFrames.length
            ];
        });

        if(progress >= 1){
            completeRoundIntro();
        }
    }

    function completeRoundIntro(){
        if(!roundIntro){
            return;
        }

        roundIntro.targets.forEach(function(target){
            target.player.x = target.toX;
            target.player.y = target.toY;
            target.player.frame = target.idleFrame;
        });

        roundIntro = null;
    }

    function handleKeyEvent(keyEvent){
        var player;

        if(roundState === 'waiting' && keyEvent.player === playerId && keyEvent.key === 'e' && !isLocalClientWaiting()){
            return false;
        }

        if(roundState === 'waiting' && nameEditor && keyEvent.player === playerId){
            if(nameEditor.handleKeyEvent(keyEvent) === false){
                renderHud();
                return false;
            }
        }

        player = players.all[keyEvent.player];

        if(!player){
            return;
        }

        if(roundState === 'ritual' || roundState === 'roundOver' || roundState === 'hitPause' || roundState === 'gameOver'){
            if(keyEvent.action === 'up'){
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if(keyEvent.key === ' ' && keyEvent.action === 'down'){
            var bullet;

            if(roundState === 'playing' && ammo[player.playerId] > 0){
                bullet = bullets.fire(player, keyEvent.shot);
            }else if(roundState === 'playing'){
                playEmptyGunSound();
            }

            if(bullet){
                ammo[player.playerId]--;
                reloadIfBothPlayersAreOutOfAmmo();
                playGunSound();

                if(!keyEvent.shot){
                    keyEvent.shot = bullet.toSnapshot();
                }

                renderHud();
            }
            return;
        }

        player.respondToKeyEvent(keyEvent);
    }

    function reloadIfBothPlayersAreOutOfAmmo(){
        var clients;

        if(roundState !== 'playing' || !latestModel){
            return;
        }

        clients = latestModel.clients || [];

        if(clients.length < 2){
            return;
        }

        if(clients.every(function(client){
            return (ammo[client.id] || 0) <= 0;
        })){
            resetAmmo();
        }
    }

    function checkForHits(){
        var hit;
        var obstacleHit;

        if(roundState !== 'playing'){
            if(roundState === 'hitPause' && roundEndsAt && new Date().getTime() >= roundEndsAt){
                endGame();
            }
            return;
        }

        obstacleHit = findBulletObstacleHit();

        if(obstacleHit){
            obstacleHit.bullet.deleteMe = true;
            handleObstacleHit(obstacleHit);
            return;
        }

        hit = GF.Collision.findBulletHit(bullets.all(), players.all);

        if(hit){
            hit.bullet.deleteMe = true;
            handlePlayerHit(hit);
        }

        if(roundEndsAt && new Date().getTime() >= roundEndsAt){
            endGame();
        }
    }

    function findBulletObstacleHit(){
        var hit = null;
        var bodies = getDamageableObstacleBodies(getCurrentScenario());

        Object.keys(bullets.all()).forEach(function(bulletId){
            var bullet = bullets.all()[bulletId];
            var bulletBox;

            if(hit || !bullet || bullet.deleteMe){
                return;
            }

            bulletBox = bullet.getHitBox();

            bodies.forEach(function(body){
                if(hit){
                    return;
                }

                if(bulletBoxOverlapsBody(bulletBox, body)){
                    hit = {
                        bullet: bullet,
                        obstacleId: body.id
                    };
                }
            });
        });

        return hit;
    }

    function getDamageableObstacleBodies(scenario){
        var bodies = [];

        if(!scenario){
            return bodies;
        }

        (scenario.cacti || []).forEach(function(cactus, index){
            var body = getCactusBody(cactus, index);

            if(body){
                bodies.push(body);
            }
        });

        if(scenario.wagon){
            getWagonObstacleCircles(scenario.wagon).forEach(function(circle){
                bodies.push(circle);
            });
        }

        return bodies;
    }

    function bulletBoxOverlapsBody(box, body){
        if(body.type === 'rect'){
            return GF.Collision.boxesOverlap(box, body);
        }

        return boxOverlapsCircle(box, body);
    }

    function boxOverlapsCircle(box, circle){
        var closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
        var closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
        var dx = circle.x - closestX;
        var dy = circle.y - closestY;

        return (dx * dx) + (dy * dy) < circle.radius * circle.radius;
    }

    function handleObstacleHit(hit){
        if(hit.bullet.ownerId !== playerId){
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

    function applyObstacleDamage(data){
        if(latestModel && data.roundNumber !== latestModel.roundNumber){
            return;
        }

        damageObstacle(data.id);
        playObstacleHitSound(data.id);
        bullets.remove(data.ownerId);
    }

    function handlePlayerHit(hit){
        var winnerSlot = getPlayerSlot(hit.winnerId);
        var target = players.all[hit.targetId];

        roundState = 'hitPause';
        hitMessage = {
            targetId: hit.targetId,
            text: 'Got me!'
        };
        playPainSound();

        if(target){
            target.playDeathAnimation();
        }

        if(winnerSlot >= 0 && winnerSlot < scores.length){
            scores[winnerSlot]++;
        }

        advanceRoundAfterHit = hit.winnerId === playerId;

        renderHud();
        players.clearKeys();
        bullets.clear();

        if(hitTimer){
            clearTimeout(hitTimer);
        }

        hitTimer = setTimeout(resetAfterHit, GF.Config.round.resetDelay);
    }

    function resetAfterHit(){
        hitMessage = null;
        hitTimer = null;
        clearPlayerDeathAnimations();

        if(roundEndsAt && new Date().getTime() >= roundEndsAt){
            endGame();
            return;
        }

        if(advanceRoundAfterHit){
            socket.emit('advanceRound');
            advanceRoundAfterHit = false;
        }

        bullets.reset();
        resetAmmo();
        startRoundRitual({ resetScores: false });
    }

    function clearPlayerDeathAnimations(){
        Object.keys(players.all).forEach(function(id){
            players.all[id].clearDeathAnimation();
        });
    }

    function endRound(winnerId){
        var winnerSlot = getPlayerSlot(winnerId);

        roundState = 'roundOver';
        closeNameEditor();
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;

        if(winnerSlot >= 0 && winnerSlot < scores.length){
            scores[winnerSlot]++;
            setRoundMessage('PLAYER ' + players.label(winnerId) + ' WINS');
        } else {
            setRoundMessage('TIME');
        }

        renderHud();
        players.clearKeys();
        bullets.clear();

        if(resetTimer){
            clearTimeout(resetTimer);
        }

        if(ritualTimer){
            clearTimeout(ritualTimer);
            ritualTimer = null;
        }

        roundIntro = null;

        if(hitTimer){
            clearTimeout(hitTimer);
            hitTimer = null;
        }

        resetTimer = setTimeout(resetRound, GF.Config.round.resetDelay);
    }

    function endGame(){
        roundState = 'gameOver';
        closeNameEditor();
        recordGameResult();
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
        setRoundMessage('');
        renderHud();
        players.clearKeys();
        bullets.clear();

        if(resetTimer){
            clearTimeout(resetTimer);
        }

        if(ritualTimer){
            clearTimeout(ritualTimer);
            ritualTimer = null;
        }

        roundIntro = null;

        if(hitTimer){
            clearTimeout(hitTimer);
            hitTimer = null;
        }

        resetTimer = setTimeout(resetToStartScreen, GF.Config.round.gameOverDelay);
    }

    function recordGameResult(){
        var resultId;

        if(!socket || !latestModel || !latestModel.gameId || !latestModel.clients){
            return;
        }

        resultId = latestModel.gameId + ':' + latestModel.roundNumber;

        if(lastRecordedResultId === resultId){
            return;
        }

        lastRecordedResultId = resultId;
        socket.emit('recordGameResult', {
            resultId: resultId,
            gameId: latestModel.gameId,
            roundNumber: latestModel.roundNumber,
            clients: latestModel.clients.map(function(client){
                return {
                    name: getClientName(client),
                    slot: client.slot
                };
            }),
            scores: scores.slice()
        });
    }

    function resetRound(){
        players.resetAll();
        bullets.reset();
        setRoundMessage('');
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
        resetTimer = null;

        if(latestModel && isReadyToStart(latestModel)){
            startRoundRitual({ resetScores: false });
            return;
        }

        roundState = 'waiting';
        syncNameEditor();
        renderHud();
    }

    function resetToStartScreen(){
        players.resetAll();
        bullets.reset();
        resetAmmo();
        setRoundMessage('');
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
        resetTimer = null;
        roundState = 'waiting';
        syncNameEditor();
        renderHud();
        socket.emit('resetReady');
    }

    function animate(){
        updateBulletCollisionEnvironment();
        updateMovementObstacleEnvironment();
        scene.moveAll();
        updateRoundIntro();
        syncLocalPlayerPosition();
        checkForHits();
        updateCamera();

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        if(shouldUseCamera()){
            camera.apply(context);
        }
            if(roundState !== 'waiting'){
                drawScenario();
            }
            scene.drawAll(context);
            drawCollisionBodies();
        context.restore();
        renderHud();
        updateTouchControls();

        setTimeout(function(){
            requestAnimFrame(animate);
        }, 0);
    }

    function syncLocalPlayerPosition(){
        var now = new Date().getTime();
        var player = players.all[playerId];

        if(roundState !== 'playing' || !player || now - lastPositionSyncAt < 80){
            return;
        }

        lastPositionSyncAt = now;
        socket.emit('playerPosition', {
            x: player.x,
            y: player.y,
            frame: player.frame,
            aim: player.aim,
            facing: player.facing
        });
    }

    function applyRemotePlayerPosition(data){
        var player;

        if(data.player === playerId || roundState !== 'playing'){
            return;
        }

        player = players.all[data.player];

        if(!player){
            return;
        }

        player.x = data.x;
        player.y = data.y;
        player.frame = data.frame;
        player.aim = data.aim;
        player.facing = data.facing;
    }

    function initTouchControls(){
        touchControls = new GF.TouchControls({
            input: inputController,
            getAimLevel: getLocalAimLevel
        });
        updateTouchControls();
    }

    function getLocalAimLevel(){
        var player = players.all[playerId];

        if(player && typeof player.getAim === 'function'){
            return player.getAim();
        }

        return GF.Config.player.defaultAim;
    }

    function updateTouchControls(){
        if(!touchControls){
            return;
        }

        touchControls.update({
            gameplay: shouldShowGameplayTouchControls(),
            waiting: roundState === 'waiting',
            playing: roundState === 'playing',
            editing: nameEditor && nameEditor.isActive(),
            highScoresVisible: roundState === 'waiting' && shouldShowHighScoresScreen(),
            aimLevel: getLocalAimLevel()
        });
    }

    function shouldShowGameplayTouchControls(){
        return roundState === 'ritual' ||
            roundState === 'playing' ||
            roundState === 'hitPause' ||
            roundState === 'roundOver';
    }

    function drawCollisionBodies(){
        if(!GF.Config.debug.showCollisionBodies){
            return;
        }

        drawCollisionBodyShapes(GF.Obstacles.all(), 'rgba(255, 80, 80, 0.75)');

        Object.keys(players.all).forEach(function(id){
            drawCircles(players.all[id].getCollisionCircles(), 'rgba(80, 180, 255, 0.8)');
        });
    }

    function drawCollisionBodyShapes(bodies, color){
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        bodies.forEach(function(body){
            if(body.type === 'rect'){
                context.strokeRect(body.x, body.y, body.width, body.height);
                return;
            }

            if(body.type === 'polygon'){
                drawPolygonPath(body.points);
                return;
            }

            drawCirclePath(body);
        });

        context.restore();
    }

    function drawCircles(circles, color){
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        circles.forEach(function(circle){
            drawCirclePath(circle);
        });

        context.restore();
    }

    function drawCirclePath(circle){
        context.beginPath();
        context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        context.stroke();
    }

    function drawPolygonPath(points){
        if(!points.length){
            return;
        }

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(function(point){
            context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.stroke();
    }

    function setupSocket(callback){
        var storedPlayerName = getStoredPlayerName();

        socket = io({
            auth: storedPlayerName ? {
                name: storedPlayerName
            } : {}
        });

        socket.on('highScores', function(nextHighScores){
            highScores = Array.isArray(nextHighScores) ? nextHighScores : [];
            renderHud();
        });

        socket.on('joinedGame', function(data){
            playerId = data.playerId;
            syncPlayers(data.model);
            callback();
        });
    }

    function bindSocketEvents(){
        socket.on('keyEvent', function(keyEvent){
            handleKeyEvent(keyEvent);
        });

        socket.on('playerPosition', applyRemotePlayerPosition);
        socket.on('obstacleDamage', applyObstacleDamage);
        socket.on('newClient', syncPlayers);
        socket.on('modelUpdate', syncPlayers);
    }

    function start(){
        initCanvas();
        initGameState();

        setupSocket(function(){
            inputController = new GF.KeysModel(socket, playerId, handleKeyEvent, {
                canReady: function(){
                    return !nameEditor || !nameEditor.isActive();
                },
                onReady: function(){
                    localReadyRequested = true;
                    renderHud();
                }
            });
            initTouchControls();
            bindSocketEvents();
            animate();
        });
    }

    document.addEventListener('DOMContentLoaded', start);

    return {
        start: start
    };
}());
