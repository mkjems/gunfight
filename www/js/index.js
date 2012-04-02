
var canvas,
    context,
    prairie,
    model;


    
function animate(){
    prairie.moveAll(); // move
    context.clearRect(0, 0, canvas.width, canvas.height); // clear
    prairie.drawAll();// draw
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
        //console.log( model, 'Model update !');
        var t = new Date().getTime();
        var timeDiff =  t - model.time;
        console.log(timeDiff, 'timeDiff');
        $('#numPlayers').text(model.numPlayers);
    });
    

          

});