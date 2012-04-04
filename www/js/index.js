

GF.index = (function(){
    var canvas,
        context,
        prairie,
        model,
        deltaServerTime,
        socket,
        schedule,
        keys;
    
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
            GF.requestAnimFrame(function(){
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
    
    function setupSocket(){ // http://socket.io/#how-to-use
        socket = io.connect(location.host);
    
        socket.on('modelUpdate', function (newModel) {
            model = newModel;
            var t = new Date().getTime();
            var timeDiff =  t - model.time;
            $('#numPlayers').text(model.numPlayers);
        });
        
        socket.on('finishSyncTime', function (timeObj) {
            var ct2 = new Date().getTime();
            var latency =  (ct2 - timeObj.clientTime)/2;
            deltaServerTime = ct2-latency - timeObj.serverTime;
            console.log(deltaServerTime, 'deltaServerTime');        
        });
        
        // start sync of watches
        var ct = new Date().getTime();
        socket.emit('syncServerTime', { clientTime: ct });
        
        socket.on('planEvent', function (pObj) {
            //console.log(pObj)
            planObj = schedule.getEventObj();
            planObj.eventTime = pObj.eventTime + deltaServerTime
            schedule.addEvent(planObj);
        });
    }
    
    $(document).ready(function(){
        init();
        setupSocket();
        schedule = new GF.Schedule(socket);
        keys = new GF.KeysModel(socket, schedule);
        animate();
    });
}())