
GF.index = (function(){
    var canvas,
        context,
        prairie,
        model,
        deltaServerTime,
        socket,
        schedule,
        keys,
        playerId;
    
    function checkForEvents(){
        var frameEvents = schedule.checkForFrameEvents()
        if(frameEvents.length !== 0){
            console.log(frameEvents);
        }
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
        socket = io.connect(location.host);
    
        socket.on('modelUpdate', function (newModel) {
            model = newModel;
            console.log('model', model);
            $('#numPlayers').text(model.clients.length);
        });
        
        socket.on('finishSyncTime', function (timeObj) {
            var ct2 = new Date().getTime();
            var latency =  (ct2 - timeObj.clientTime)/2;
            deltaServerTime = ct2-latency - timeObj.serverTime;
            playerId = timeObj.playerId;
            $('#playerId').text(playerId);
            console.log(deltaServerTime, 'deltaServerTime');
            callback();    
        });
        
        // start sync of watches
        var ct = new Date().getTime();
        socket.emit('syncServerTime', { clientTime: ct });
        
        // planning
        socket.on('planEvent', function (pObj) {
            //console.log(pObj)
            planObj = schedule.getEventObj();
            planObj.eventTime = pObj.eventTime + deltaServerTime
            schedule.addEvent(planObj);
        });
        
        // model updates
        

        
    }
    
    $(document).ready(function(){
        init();
        setupSocket(function(){
            schedule = new GF.Schedule(socket);
            keys = new GF.KeysModel(socket, schedule, playerId );
            socket.on('keyEvent', function (keyEvent) {
                //keyStatus[keyEvent.key] = true;
                schedule.addEvent(keyEvent);
                //console.log(keyEvent.key);
            });
            animate();
        });
        
        
        
    });
}())