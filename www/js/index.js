
GF.index = (function(){
    var canvas,
        context,
        prairie,
        model,
        deltaServerTime,
        GFsocket,
        schedule,
        players,
        playerId;
    
    function checkForEvents(){
        var frameEvents = schedule.checkForFrameEvents();
        frameEvents.forEach(function(val){
            if(val.eventName === 'clientKeyEvent' && players[val.player]){
                players[val.player].respondToKeyEvent(val);
            }
        });   
    }
        
    function animate(){
        
        checkForEvents();
        
        prairie.moveAll();
        
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
        canvas.width = 800;
        canvas.height = 640;
        prairie = new GF.Scene();
        players = {};
        model = { clients: [] };
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
            document.getElementById('playerId').textContent = playerId;
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
