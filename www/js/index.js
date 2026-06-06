GF.Game = (function(){
    var HUD_TEXT_SIZE = 14;

    var canvas,
        context,
        hudCanvas,
        hudContext,
        ammoSprite,
        wagonSprite,
        cactusSprite,
        rockPatternSprite,
        rockPattern,
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
        wagonSprite.src = 'images/wagon.png';
        cactusSprite = new Image();
        cactusSprite.src = 'images/cactus.png';
        rockPatternSprite = new Image();
        rockPatternSprite.onload = function(){
            rockPattern = createScaledPattern(rockPatternSprite);
        };
        rockPatternSprite.src = 'images/rock-pattern.png';
        disableImageSmoothing();
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

        (scenario.cacti || []).forEach(function(cactus){
            drawCactus(cactus.x, cactus.y);
        });

        drawRocks(scenario);

        if(scenario.wagon){
            drawWagon(scenario.wagon);
        }
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

    function drawCactus(x, y){
        var scale = GF.Config.graphics.scale;
        var width = 17 * scale;
        var height = 32 * scale;

        context.save();

        if(cactusSprite && cactusSprite.complete){
            context.drawImage(cactusSprite, x - (width / 2), y - height, width, height);
        } else {
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(x - (width / 2), y - height, width, height);
        }

        context.restore();
    }

    function drawWagon(wagon){
        var elapsed = scenarioStartedAt ? new Date().getTime() - scenarioStartedAt : 0;
        var duration = wagon.duration || 10000;
        var progress = Math.min(1, Math.max(0, elapsed / duration));
        var y = wagon.fromY + ((wagon.toY - wagon.fromY) * progress);
        var x = wagon.x;
        var scale = GF.Config.graphics.scale;
        var width = 37 * scale;
        var height = 38 * scale;

        context.save();

        if(wagonSprite && wagonSprite.complete){
            context.drawImage(wagonSprite, x - (width / 2), y - (height / 2), width, height);
        } else {
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(x - (width / 2), y - (height / 2), width, height);
        }

        context.restore();
    }

    function drawStartScreen(){
        var controls = [
            'h j k l - left down up right',
            'a z - aim high low',
            'Space - shoot'
        ];
        var y = 176;

        drawHudText('GUNFIGHT 1975', 475, 104, 'center');
        drawHudText(getPlayerLabel(), 475, 132, 'center');

        controls.forEach(function(control){
            drawHudText(control, 475, y, 'center');
            y += 22;
        });

        y += 24;
        (latestModel ? latestModel.clients : []).forEach(function(client, index){
            drawHudText('Player ' + (index + 1) + ' : ' + (client.ready ? 'READY' : 'waiting'), 475, y, 'center');
            y += 22;
        });

        y += 18;
        drawHudText('INSERT COIN', 475, y, 'center');

        if(shouldShowBlinkingPrompt()){
            drawHudText('PRESS P TO PLAY', 475, y + 32, 'center');
        }
    }

    function shouldShowBlinkingPrompt(){
        return Math.floor(new Date().getTime() / 1000) % 2 === 0;
    }

    function getPlayerLabel(){
        var model = latestModel;
        var playerIndex;

        if(!model){
            return '';
        }

        playerIndex = model.clients.findIndex(function(client){
            return client.id === playerId;
        });

        return playerIndex >= 0 ? 'Player ' + (playerIndex + 1) : '';
    }

    function syncPlayers(model){
        latestModel = model;
        players.sync(model, {
            resetChangedSlots: roundState === 'waiting'
        });

        if(roundState === 'waiting' && isReadyToStart(model)){
            startRoundRitual({ resetScores: true });
            return;
        }

        renderHud();
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
            }

            if(bullet){
                ammo[player.playerId]--;

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

        if(roundState !== 'playing'){
            if(roundState === 'hitPause' && roundEndsAt && new Date().getTime() >= roundEndsAt){
                endGame();
            }
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

    function handlePlayerHit(hit){
        var winnerSlot = getPlayerSlot(hit.winnerId);

        roundState = 'hitPause';
        hitMessage = {
            targetId: hit.targetId,
            text: 'Got me!'
        };

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
        resetTimer = null;
        roundState = 'waiting';
        renderHud();
        socket.emit('resetReady');
    }

    function animate(){
        updateBulletCollisionEnvironment();
        scene.moveAll();
        updateRoundIntro();
        checkForHits();

        context.clearRect(0, 0, canvas.width, canvas.height);
        if(roundState !== 'waiting'){
            drawScenario();
        }
        scene.drawAll(context);
        drawHitMessage();
        renderHud();

        setTimeout(function(){
            requestAnimFrame(animate);
        }, 0);
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
