
GF.index = (function(){
    var canvas,
        context,
        prairie,
        model,
        deltaServerTime,
        GFsocket,
        schedule,
        players,
        bullets,
        roundState,
        resetTimer,
        playerId;
    
    function checkForEvents(){
        var frameEvents = schedule.checkForFrameEvents();
        frameEvents.forEach(function(val){
            if(val.eventName !== 'clientKeyEvent' || !players[val.player]){
                return;
            }

            if(roundState !== 'playing'){
                if(val.action === 'up'){
                    players[val.player].respondToKeyEvent(val);
                }
                return;
            }

            if(val.key === ' ' && val.action === 'down'){
                shoot(players[val.player]);
                return;
            }

            players[val.player].respondToKeyEvent(val);
        });   
    }
        
    function animate(){
        
        checkForEvents();
        
        prairie.moveAll();

        checkForHits();
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        prairie.drawAll(context);
        
        setTimeout(function(){
            requestAnimFrame(function(){
                animate();
            });
        },0);
    }
    
    function init(){
        canvas = document.getElementById("canvas");
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        canvas.width = 950;
        canvas.height = 640;
        prairie = new GF.Scene();
        players = {};
        bullets = {};
        model = { clients: [] };
        roundState = 'playing';
        resetTimer = null;
    }

    function shoot(player){
        var activeBullet = bullets[player.playerId];

        if(activeBullet && !activeBullet.deleteMe){
            return;
        }

        bullets[player.playerId] = new GF.Bullet(player);
        prairie.addFigure(bullets[player.playerId]);
    }

    function boxesOverlap(a, b){
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    function checkForHits(){
        if(roundState !== 'playing'){
            return;
        }

        Object.keys(bullets).forEach(function(bulletId){
            var bullet = bullets[bulletId];

            if(!bullet || bullet.deleteMe){
                return;
            }

            Object.keys(players).forEach(function(targetId){
                var target = players[targetId];

                if(roundState !== 'playing' || targetId === String(bullet.ownerId)){
                    return;
                }

                if(boxesOverlap(bullet.getHitBox(), target.getHitBox())){
                    bullet.deleteMe = true;
                    endRound(bullet.ownerId);
                }
            });
        });
    }

    function getPlayerLabel(id){
        var player = players[id];

        if(!player){
            return id;
        }

        return player.slot + 1;
    }

    function setRoundMessage(message){
        document.getElementById('roundMessage').textContent = message;
    }

    function endRound(winnerId){
        roundState = 'roundOver';
        setRoundMessage('PLAYER ' + getPlayerLabel(winnerId) + ' WINS');

        Object.keys(players).forEach(function(id){
            players[id].clearKeys();
        });

        Object.keys(bullets).forEach(function(id){
            bullets[id].deleteMe = true;
            delete bullets[id];
        });

        if(resetTimer){
            clearTimeout(resetTimer);
        }

        resetTimer = setTimeout(function(){
            resetRound();
        }, 1800);
    }

    function resetRound(){
        Object.keys(players).forEach(function(id){
            var player = players[id];
            var slot = getPlayerSlot(player.slot);

            player.resetTo(slot);
        });

        bullets = {};
        setRoundMessage('');
        roundState = 'playing';
        resetTimer = null;
    }

    function getPlayerSlot(index){
        var slots = [
            { x: 150, y: 430, facing: 1, frame: 0 },
            { x: 650, y: 430, facing: -1, frame: 2 },
            { x: 260, y: 260, facing: 1, frame: 1 },
            { x: 540, y: 260, facing: -1, frame: 3 }
        ];

        return slots[index % slots.length];
    }

    function ensurePlayer(client, index){
        var slot = getPlayerSlot(index);
        var id = client.id;

        if(players[id]){
            players[id].playerId = id;
            players[id].slot = index;
            players[id].facing = slot.facing;
            players[id].idleFrame = slot.frame;
            return;
        }

        players[id] = new GF.Controllable(slot.x, slot.y, {
            playerId: id,
            facing: slot.facing,
            frame: slot.frame
        });
        players[id].slot = index;
        prairie.addFigure(players[id]);
    }

    function syncPlayers(newModel){
        var activePlayers = {};

        model = newModel;
        document.getElementById('numPlayers').textContent = model.clients.length;

        model.clients.forEach(function(client, index){
            activePlayers[client.id] = true;
            ensurePlayer(client, index);
        });

        Object.keys(players).forEach(function(id){
            if(!activePlayers[id]){
                players[id].deleteMe = true;
                if(bullets[id]){
                    bullets[id].deleteMe = true;
                    delete bullets[id];
                }
                delete players[id];
            }
        });
    }
    
    function setupSocket(callback){ // http://socket.io/#how-to-use
        GFsocket = io();
            
        GFsocket.on('finishSyncTime', function (timeObj) {
            var ct2 = new Date().getTime();
            var latency =  (ct2 - timeObj.clientTime)/2;
            deltaServerTime = ct2-latency - timeObj.serverTime;
            playerId = timeObj.playerId;
            syncPlayers(timeObj.model);
            callback();    
        });
        
        var ct = new Date().getTime();
        GFsocket.emit('syncServerTime', { clientTime: ct }); // start sync of watches
        
    }
    
    document.addEventListener('DOMContentLoaded', function(){
        init();
        setupSocket(function(){
            schedule = new GF.Schedule(GFsocket);
            new GF.KeysModel(GFsocket, playerId);
            
            GFsocket.on('keyEvent', function (keyEvent) { // plan key event
                schedule.addEvent(keyEvent);
            });
            
            GFsocket.on('planEvent', function (pObj) { // plan event
                var planObj = schedule.getEventObj();
                planObj.eventTime = pObj.eventTime + deltaServerTime;
                schedule.addEvent(planObj);
            });

            GFsocket.on('newClient', function (newModel) {
                syncPlayers(newModel);
            });

            GFsocket.on('modelUpdate', function (newModel) {
                syncPlayers(newModel);
            });
                        
            animate();
        });
        
        
        
    });
}())
