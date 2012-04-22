
GF.index = (function(){
    var canvas,
        context,
        prairie,
        model,
        deltaServerTime,
        GFsocket,
        schedule,
        keys,
        playerId;
    
    function checkForEvents(){
        var frameEvents = schedule.checkForFrameEvents()
        frameEvents.forEach(function(val,index){
            console.log('val', val);
            
        });   
    }
        
    function animate(){
        
        checkForEvents();
        
        prairie.moveAll(); // move (update the world) 
        
        context.clearRect(0, 0, canvas.width, canvas.height); // clear
        
        prairie.drawAll();// draw
        
        setTimeout(function(){     // request new frame
            requestAnimFrame(function(){
                animate();
            });
        },0);
    }
    
    function init(){
        context = $('#canvas')[0].getContext("2d");
        canvas = document.getElementById("canvas");
        canvas.width = 800;
        canvas.height = 640;
        prairie = new GF.Scene();
        model = {};
    }
    
    function setupSocket(callback){ // http://socket.io/#how-to-use
        GFsocket = io.connect(location.host);
            
        GFsocket.on('finishSyncTime', function (timeObj) {
            var ct2 = new Date().getTime();
            var latency =  (ct2 - timeObj.clientTime)/2;
            deltaServerTime = ct2-latency - timeObj.serverTime;
            playerId = timeObj.playerId;
            $('#playerId').text(playerId);
            console.log(deltaServerTime, 'deltaServerTime');
            callback();    
        });
        
        var ct = new Date().getTime();
        GFsocket.emit('syncServerTime', { clientTime: ct }); // start sync of watches
        
    }
    
    $(document).ready(function(){
        init();
        setupSocket(function(){
            schedule = new GF.Schedule(GFsocket);
            keys = new GF.KeysModel(GFsocket, schedule, playerId );
            
            GFsocket.on('keyEvent', function (keyEvent) { // plan key event
                schedule.addEvent(keyEvent);
            });
            
            GFsocket.on('planEvent', function (pObj) { // plan event
                planObj = schedule.getEventObj();
                planObj.eventTime = pObj.eventTime + deltaServerTime
                schedule.addEvent(planObj);
            });

            GFsocket.on('newClient', function (newClientId) {
                //model = newModel;
                //console.log('model', model);
                $('#numPlayers').text(model.clients.length);
            });
                        
            animate();
        });
        
        
        
    });
}())