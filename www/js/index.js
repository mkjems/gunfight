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
        countdownTimer,
        resetTimer,
        playerId;

    function initCanvas(){
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        canvas.width = GF.Config.canvas.width;
        canvas.height = GF.Config.canvas.height;
        disableImageSmoothing();
        scaleCanvas();
        window.addEventListener('resize', scaleCanvas);
    }

    function disableImageSmoothing(){
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
    }

    function scaleCanvas(){
        var scale = Math.max(1, Math.floor(Math.min(
            window.innerWidth / GF.Config.canvas.width,
            window.innerHeight / GF.Config.canvas.height
        )));

        canvas.style.width = (GF.Config.canvas.width * scale) + 'px';
        canvas.style.height = (GF.Config.canvas.height * scale) + 'px';
    }

    function initGameState(){
        scene = new GF.Scene();
        bullets = new GF.Bullets(scene);
        players = new GF.Players(scene, bullets);
        roundState = 'waiting';
        countdownTimer = null;
        resetTimer = null;
    }

    function setRoundMessage(message){
        document.getElementById('roundMessage').textContent = message;
    }

    function syncPlayers(model){
        latestModel = model;
        players.sync(model);
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
    }

    function startCountdown(){
        var count = 3;

        roundState = 'countdown';
        setOverlayVisible(false);
        setRoundMessage(count);

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
            roundState = 'playing';
        }, 1000);
    }

    function handleKeyEvent(keyEvent){
        var player = players.all[keyEvent.player];

        if(!player){
            return;
        }

        if(roundState === 'roundOver'){
            if(keyEvent.action === 'up'){
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if(keyEvent.key === ' ' && keyEvent.action === 'down'){
            if(roundState === 'playing'){
                bullets.fire(player);
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
            return;
        }

        hit = GF.Collision.findBulletHit(bullets.all(), players.all);

        if(hit){
            hit.bullet.deleteMe = true;
            endRound(hit.winnerId);
        }
    }

    function endRound(winnerId){
        roundState = 'roundOver';
        setRoundMessage('PLAYER ' + players.label(winnerId) + ' WINS');
        players.clearKeys();
        bullets.clear();

        if(resetTimer){
            clearTimeout(resetTimer);
        }

        if(countdownTimer){
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

        resetTimer = setTimeout(resetRound, GF.Config.round.resetDelay);
    }

    function resetRound(){
        players.resetAll();
        bullets.reset();
        setRoundMessage('');
        resetTimer = null;

        if(latestModel && isReadyToStart(latestModel)){
            startCountdown();
            return;
        }

        roundState = 'waiting';
        setOverlayVisible(true);
    }

    function animate(){
        processScheduledEvents();
        scene.moveAll();
        checkForHits();

        context.clearRect(0, 0, canvas.width, canvas.height);
        scene.drawAll(context);

        setTimeout(function(){
            requestAnimFrame(animate);
        }, 0);
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
