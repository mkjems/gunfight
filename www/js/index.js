GF.Game = (function(){
    var HUD_TEXT_SIZE = 14;

    var canvas,
        context,
        hudCanvas,
        hudContext,
        ammoSprite,
        wagonSprite,
        cactusSprite,
        saloonSprite,
        rockPatternSprite,
        rockPattern,
        soundEffects,
        audioContext,
        scene,
        socket,
        players,
        bullets,
        roundState,
        latestModel,
        scores,
        ammo,
        roundEndsAt,
        roundMessageText,
        hitMessage,
        ritualTimer,
        hitTimer,
        resetTimer,
        scenarioStartedAt,
        roundIntro,
        advanceRoundAfterHit,
        lastPositionSyncAt,
        obstacleDamage,
        playerId;

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
        initSoundEffects();
        disableImageSmoothing();
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
        scores = [0, 0];
        ammo = {};
        roundEndsAt = null;
        roundMessageText = '';
        hitMessage = null;
        ritualTimer = null;
        hitTimer = null;
        resetTimer = null;
        scenarioStartedAt = null;
        roundIntro = null;
        advanceRoundAfterHit = false;
        lastPositionSyncAt = 0;
        obstacleDamage = {};
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

        if(roundMessageText){
            drawRoundMessage(roundMessageText);
        }

        if(roundState === 'waiting'){
            drawStartScreen();
            return;
        }

        firstClient = latestModel && latestModel.clients[0];
        secondClient = latestModel && latestModel.clients[1];

        if(!firstClient || !secondClient){
            return;
        }

        firstAmmo = ammo[firstClient.id] || 0;
        secondAmmo = ammo[secondClient.id] || 0;

        drawHudText(scores[0] || 0, 122, 22, 'left');
        drawHudText(scores[1] || 0, 828, 22, 'right');
        drawHudText(secondsLeft, 475, 22, 'center');
        drawAmmo(firstAmmo, 122, 606, 1);
        drawAmmo(secondAmmo, 828, 606, -1);
    }

    function drawHudText(text, x, y, align){
        hudContext.save();
        hudContext.font = HUD_TEXT_SIZE + 'px "Press Start", sans-serif';
        hudContext.textAlign = align;
        hudContext.textBaseline = 'top';
        hudContext.fillStyle = GF.Config.colors.yellow;
        hudContext.shadowColor = 'rgb(0,0,0)';
        hudContext.shadowOffsetX = 1;
        hudContext.shadowOffsetY = 1;
        hudContext.fillText(text, x, y);
        hudContext.restore();
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

    function drawRoundMessage(message){
        drawHudText(message, 475, 262, 'center');
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

    function drawStartScreen(){
        var controls = [
            'h j k l - left down up right',
            'a z - aim up down',
            'Space - shoot'
        ];
        var y = 190;

        drawHudText('GUNFIGHT 1975', 475, 104, 'center');
        drawHudText(getLobbyPlayerLabel(), 475, 132, 'center');
        drawHudText(getGameLabel(), 475, 154, 'center');

        controls.forEach(function(control){
            drawHudText(control, 475, y, 'center');
            y += 22;
        });

        y += 24;
        getLobbySlots().forEach(function(client, index){
            drawHudText(getLobbySlotLabel(client, index), 475, y, 'center');
            y += 22;
        });

        y += 18;

        if(shouldShowLobbyMessage()){
            drawHudText(getLobbyMessage(), 475, y, 'center');
        }

        if(shouldShowLobbyPrompt()){
            drawHudText('PRESS P TO PLAY', 475, y + 32, 'center');
        }
    }

    function shouldShowBlinkingPrompt(){
        return Math.floor(new Date().getTime() / 1000) % 2 === 0;
    }

    function shouldShowLobbyPrompt(){
        if(!shouldShowBlinkingPrompt()){
            return false;
        }

        if(getLobbyMessage() === 'PRESS P TO PLAY'){
            return false;
        }

        return !latestModel || latestModel.status !== 'abandoned';
    }

    function shouldShowLobbyMessage(){
        if(getLobbyMessage() !== 'PRESS P TO PLAY'){
            return true;
        }

        return shouldShowBlinkingPrompt();
    }

    function getLobbyPlayerLabel(){
        var model = latestModel;
        var client;
        var playerIndex;

        if(!model){
            return '';
        }

        playerIndex = (model.clients || []).findIndex(function(client){
            return client.id === playerId;
        });

        client = (model.clients || [])[playerIndex];

        if(!client){
            return '';
        }

        return getClientName(client) + ' - PLAYER ' + (playerIndex + 1);
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
        if(!client){
            return 'PLAYER ' + (index + 1) + ' : WAITING';
        }

        return getClientName(client) + ' - PLAYER ' + (index + 1) + ' : ' + (client.ready ? 'READY' : 'WAITING');
    }

    function getLobbyMessage(){
        if(latestModel && latestModel.message){
            return latestModel.message;
        }

        return 'INSERT COIN';
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

        roundIntro = null;
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
        roundState = 'waiting';
        players.clearKeys();
        bullets.clear();
    }

    function syncPlayers(model){
        var previousModel = latestModel;

        latestModel = model;

        if(model.status === 'abandoned'){
            enterLobbyState();
        }

        if(didAnyClientBecomeReady(previousModel, model)){
            playReadySound();
        }

        players.sync(model, {
            resetChangedSlots: roundState === 'waiting'
        });

        if(roundState === 'waiting' && isReadyToStart(model)){
            startRoundRitual({ resetScores: true });
            return;
        }

        renderHud();
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
            setRoundMessage('DRAW !');

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
        var player = players.all[keyEvent.player];

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

        context.clearRect(0, 0, canvas.width, canvas.height);
        if(roundState !== 'waiting'){
            drawScenario();
        }
        scene.drawAll(context);
        drawCollisionBodies();
        drawHitMessage();
        renderHud();

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

    function drawHitMessage(){
        var target;

        if(!hitMessage){
            return;
        }

        target = players.all[hitMessage.targetId];

        if(!target){
            return;
        }

        context.save();
        context.fillStyle = GF.Config.colors.yellow;
        context.font = HUD_TEXT_SIZE + 'px "Press Start", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.shadowColor = 'rgb(0,0,0)';
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
        context.fillText(hitMessage.text, target.x, Math.max(80, target.y - 150));
        context.restore();
    }

    function setupSocket(callback){
        socket = io();

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
            new GF.KeysModel(socket, playerId, handleKeyEvent);
            bindSocketEvents();
            animate();
        });
    }

    document.addEventListener('DOMContentLoaded', start);

    return {
        start: start
    };
}());
