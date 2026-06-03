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
        roundState = 'playing';
        resetTimer = null;
    }

    function setRoundMessage(message){
        document.getElementById('roundMessage').textContent = message;
    }

    function syncPlayers(model){
        document.getElementById('numPlayers').textContent = model.clients.length;
        players.sync(model);
    }

    function handleKeyEvent(keyEvent){
        var player = players.all[keyEvent.player];

        if(!player){
            return;
        }

        if(roundState !== 'playing'){
            if(keyEvent.action === 'up'){
                player.respondToKeyEvent(keyEvent);
            }
            return;
        }

        if(keyEvent.key === ' ' && keyEvent.action === 'down'){
            bullets.fire(player);
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

        resetTimer = setTimeout(resetRound, GF.Config.round.resetDelay);
    }

    function resetRound(){
        players.resetAll();
        bullets.reset();
        setRoundMessage('');
        roundState = 'playing';
        resetTimer = null;
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
