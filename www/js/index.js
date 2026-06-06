GF.Game = (function(){
    var canvas,
        context,
        scene,
        socket,
        schedule,
        players,
        bullets,
        deltaServerTime,
        roundState,
        latestModel,
        scores,
        ammo,
        roundEndsAt,
        hitMessage,
        countdownTimer,
        hitTimer,
        resetTimer,
        playerId;

    function initCanvas(){
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        canvas.width = GF.Config.canvas.width;
        canvas.height = GF.Config.canvas.height;
        disableImageSmoothing();
    }

    function disableImageSmoothing(){
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
    }

    function initGameState(){
        scene = new GF.Scene();
        bullets = new GF.Bullets(scene);
        players = new GF.Players(scene, bullets);
        roundState = 'waiting';
        scores = [0, 0];
        ammo = {};
        roundEndsAt = null;
        hitMessage = null;
        countdownTimer = null;
        hitTimer = null;
        resetTimer = null;
    }

    function setRoundMessage(message){
        document.getElementById('roundMessage').textContent = message;
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

    function renderAmmo(elementId, count){
        var element = document.getElementById(elementId);
        var i;

        if(element.getAttribute('data-count') === String(count)){
            return;
        }

        element.setAttribute('data-count', count);
        element.innerHTML = '';

        for(i = 0; i < count; i++){
            var round = document.createElement('span');

            round.className = 'ammoRound';
            element.appendChild(round);
        }
    }

    function renderHud(){
        var secondsLeft = GF.Config.round.seconds;
        var firstClient;
        var secondClient;

        if(roundEndsAt){
            secondsLeft = Math.max(0, Math.ceil((roundEndsAt - new Date().getTime()) / 1000));
        }

        if(roundState === 'gameOver'){
            secondsLeft = 'GAME OVER';
        }

        document.getElementById('scoreLeft').textContent = scores[0] || 0;
        document.getElementById('scoreRight').textContent = scores[1] || 0;
        document.getElementById('roundTimer').textContent = secondsLeft;
        document.getElementById('roundTimer').className = roundState === 'gameOver' ? 'gameOver' : '';

        firstClient = latestModel && latestModel.clients[0];
        secondClient = latestModel && latestModel.clients[1];

        renderAmmo('ammoLeft', firstClient ? ammo[firstClient.id] || 0 : 0);
        renderAmmo('ammoRight', secondClient ? ammo[secondClient.id] || 0 : 0);
    }

    function setPlayerLabel(model){
        var playerIndex = model.clients.findIndex(function(client){
            return client.id === playerId;
        });

        document.getElementById('playerLabel').textContent = playerIndex >= 0 ? 'Player ' + (playerIndex + 1) : '';
    }

    function syncPlayers(model){
        latestModel = model;
        players.sync(model);
        renderHud();
        setPlayerLabel(model);
        renderReadyList(model);

        if(roundState === 'waiting' && isReadyToStart(model)){
            startCountdown();
        }
    }

    function renderReadyList(model){
        var readyList = document.getElementById('readyList');

        readyList.innerHTML = '';

        model.clients.forEach(function(client, index){
            var item = document.createElement('li');

            item.textContent = 'Player ' + (index + 1) + ' : ' + (client.ready ? 'ready' : 'waiting');
            readyList.appendChild(item);
        });
    }

    function isReadyToStart(model){
        return model.clients.length >= 2 && model.clients.every(function(client){
            return client.ready;
        });
    }

    function setOverlayVisible(isVisible){
        document.getElementById('gameOverlay').className = isVisible ? '' : 'hidden';
        document.getElementById('bottomControls').className = isVisible ? '' : 'visible';
        document.getElementById('gameHud').className = latestModel && latestModel.clients.length >= 2 ? 'visible' : '';
    }

    function startCountdown(){
        var count = 3;

        if(roundState === 'waiting'){
            scores = [0, 0];
        }

        roundState = 'countdown';
        roundEndsAt = null;
        resetAmmo();
        setOverlayVisible(false);
        setRoundMessage(count);
        renderHud();

        if(countdownTimer){
            clearInterval(countdownTimer);
        }

        countdownTimer = setInterval(function(){
            count--;

            if(count > 0){
                setRoundMessage(count);
                return;
            }

            clearInterval(countdownTimer);
            countdownTimer = null;
            setRoundMessage('');
            roundEndsAt = new Date().getTime() + (GF.Config.round.seconds * 1000);
            resetAmmo();
            renderHud();
            roundState = 'playing';
        }, 1000);
    }

    function handleKeyEvent(keyEvent){
        var player = players.all[keyEvent.player];

        if(!player){
            return;
        }

        if(roundState === 'roundOver' || roundState === 'hitPause'){
            if(keyEvent.action === 'up'){
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if(keyEvent.key === ' ' && keyEvent.action === 'down'){
            if(roundState === 'playing' && ammo[player.playerId] > 0 && bullets.fire(player)){
                ammo[player.playerId]--;
                renderHud();
            }
            return;
        }

        player.respondToKeyEvent(keyEvent);
    }

    function processScheduledEvents(){
        schedule.checkForFrameEvents().forEach(function(event){
            if(event.eventName === 'clientKeyEvent'){
                handleKeyEvent(event);
            }
        });
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

        players.resetAll();
        bullets.reset();
        resetAmmo();
        renderHud();
        roundState = 'playing';
    }

    function endRound(winnerId){
        var winnerSlot = getPlayerSlot(winnerId);

        roundState = 'roundOver';
        roundEndsAt = null;
        hitMessage = null;

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

        if(countdownTimer){
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

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
        setRoundMessage('');
        renderHud();
        players.clearKeys();
        bullets.clear();

        if(resetTimer){
            clearTimeout(resetTimer);
        }

        if(countdownTimer){
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

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
        resetTimer = null;

        if(latestModel && isReadyToStart(latestModel)){
            startCountdown();
            return;
        }

        roundState = 'waiting';
        setOverlayVisible(true);
    }

    function resetToStartScreen(){
        players.resetAll();
        bullets.reset();
        resetAmmo();
        setRoundMessage('');
        roundEndsAt = null;
        hitMessage = null;
        resetTimer = null;
        roundState = 'waiting';
        setOverlayVisible(true);
        renderHud();
        socket.emit('resetReady');
    }

    function animate(){
        processScheduledEvents();
        scene.moveAll();
        checkForHits();

        context.clearRect(0, 0, canvas.width, canvas.height);
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
        context.font = '32px "Press Start", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.shadowColor = 'rgb(0,0,0)';
        context.shadowOffsetX = 4;
        context.shadowOffsetY = 4;
        context.fillText(hitMessage.text, target.x, Math.max(80, target.y - 150));
        context.restore();
    }

    function setupSocket(callback){
        socket = io();

        socket.on('finishSyncTime', function(timeObj){
            var clientTimeAfterSync = new Date().getTime();
            var latency = (clientTimeAfterSync - timeObj.clientTime) / 2;

            deltaServerTime = clientTimeAfterSync - latency - timeObj.serverTime;
            playerId = timeObj.playerId;
            syncPlayers(timeObj.model);
            callback();
        });

        socket.emit('syncServerTime', {
            clientTime: new Date().getTime()
        });
    }

    function bindSocketEvents(){
        socket.on('keyEvent', function(keyEvent){
            keyEvent.eventTime += deltaServerTime;
            schedule.addEvent(keyEvent);
        });

        socket.on('planEvent', function(event){
            var planObj = schedule.getEventObj();

            planObj.eventTime = event.eventTime + deltaServerTime;
            schedule.addEvent(planObj);
        });

        socket.on('newClient', syncPlayers);
        socket.on('modelUpdate', syncPlayers);
    }

    function start(){
        initCanvas();
        initGameState();
        setOverlayVisible(true);

        setupSocket(function(){
            schedule = new GF.Schedule(socket);
            new GF.KeysModel(socket, playerId);
            bindSocketEvents();
            animate();
        });
    }

    document.addEventListener('DOMContentLoaded', start);

    return {
        start: start
    };
}());
