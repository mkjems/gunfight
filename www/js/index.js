GF.Game = (function(){
    var HUD_TEXT_SIZE = 14;

    var canvas,
        context,
        hudCanvas,
        hudContext,
        ammoSprite,
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
            drawCactus(cactus.x, cactus.y, cactus.scale || 1);
        });

        drawRocks(scenario);

        if(scenario.wagon){
            drawWagon(scenario.wagon);
        }
    }

    function drawRocks(scenario){
        getRockLines(scenario).forEach(function(line){
            context.save();
            context.strokeStyle = GF.Config.colors.yellow;
            context.lineWidth = 4;
            context.lineCap = 'square';
            context.shadowColor = 'rgb(0,0,0)';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.beginPath();
            context.moveTo(line.x1, line.y1);
            context.lineTo(line.x2, line.y2);
            context.stroke();
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

    function drawCactus(x, y, scale){
        var width = 8 * scale;
        var height = 62 * scale;
        var armWidth = 24 * scale;
        var armHeight = 8 * scale;

        context.save();
        context.fillStyle = GF.Config.colors.yellow;
        context.shadowColor = 'rgb(0,0,0)';
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillRect(x - (width / 2), y - height, width, height);
        context.fillRect(x - (armWidth / 2), y - (height * 0.72), armWidth, armHeight);
        context.fillRect(x + (armWidth / 2) - width, y - (height * 0.92), width, height * 0.24);
        context.fillRect(x - (armWidth / 2), y - (height * 0.58), width, height * 0.22);
        context.restore();
    }

    function drawWagon(wagon){
        var elapsed = scenarioStartedAt ? new Date().getTime() - scenarioStartedAt : 0;
        var duration = wagon.duration || 10000;
        var progress = Math.min(1, Math.max(0, elapsed / duration));
        var y = wagon.fromY + ((wagon.toY - wagon.fromY) * progress);
        var x = wagon.x;

        context.save();
        context.fillStyle = GF.Config.colors.yellow;
        context.shadowColor = 'rgb(0,0,0)';
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillRect(x - 34, y - 12, 68, 24);
        context.fillRect(x - 24, y - 34, 48, 22);
        context.clearRect(x - 10, y - 25, 20, 13);
        context.fillRect(x - 42, y + 10, 8, 24);
        context.fillRect(x + 34, y + 10, 8, 24);
        context.fillRect(x - 44, y + 30, 88, 5);
        context.restore();
    }

    function drawStartScreen(){
        var controls = [
            'h left',
            'j down',
            'k up',
            'l right',
            'a aim up',
            'z aim level',
            'space shoot'
        ];
        var y = 162;

        drawHudText('GUNFIGHT', 475, 104, 'center');
        drawHudText(getPlayerLabel(), 475, 132, 'center');

        controls.forEach(function(control){
            drawHudText(control, 475, y, 'center');
            y += 22;
        });

        y += 12;
        (latestModel ? latestModel.clients : []).forEach(function(client, index){
            drawHudText('Player ' + (index + 1) + ' : ' + (client.ready ? 'ready' : 'waiting'), 475, y, 'center');
            y += 22;
        });

        y += 18;
        drawHudText('INSERT COIN', 475, y, 'center');
        drawHudText('PRESS P TO PLAY', 475, y + 32, 'center');
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
        players.sync(model);

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
