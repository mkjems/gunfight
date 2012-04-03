
var canvas,
    context,
    prairie,
    model,
    deltaServerTime,
    planed;


function checkForEvents(){
    var t = new Date().getTime();
    if(planed && planed.nextEventTime < t){
        prairie.addFigure(new Controllable(planed.x, planed.y));
        planed = undefined;
    }
}

    
function animate(){
    
    prairie.moveAll(); // move (update the world) 
    
    context.clearRect(0, 0, canvas.width, canvas.height); // clear
    
    prairie.drawAll();// draw
    
    checkForEvents();
    setTimeout(function(){     // request new frame
        requestAnimFrame(function(){
            animate();
        });
    },0);
}

$(document).ready(function(){
    context = $('#canvas')[0].getContext("2d");
    canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 640;
    
    prairie = new Scene();
    var c = new Controllable();
    //c.addEventHandlers(c);
    prairie.addFigure(c);
    animate();
    
    model = {};
    
    // http://socket.io/#how-to-use
    location
    var socket = io.connect(location.host);

    socket.on('modelUpdate', function (newModel) {
        model = newModel;
        var t = new Date().getTime();
        var timeDiff =  t - model.time;
        console.log(timeDiff, 'timeDiff');
        $('#numPlayers').text(model.numPlayers);
    });
    
    socket.on('startSyncTime', function () {
        var ct = new Date().getTime();
        console.log('startSyncTime', ct);
        socket.emit('syncServerTime', { clientTime: ct });
    });

    socket.on('finishSyncTime', function (timeObj) {
        var ct2 = new Date().getTime();
        var latency =  (ct2 - timeObj.clientTime)/2;
        console.log(latency, 'latency');
        
        console.log('client time', ct2);
        console.log('server time', timeObj.serverTime);

        
        deltaServerTime = ct2-latency - timeObj.serverTime;
        console.log(deltaServerTime, 'deltaServerTime');        
        
    });

    socket.on('planEvent', function (planObj) {
        console.log(planObj, 'planObj');
        planObj.nextEventTime += deltaServerTime
        planed = planObj;
    });       

});