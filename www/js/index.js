
var canvas,
    context,
    prairie;

canvas.width = 800;
canvas.height = 640;
    
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
    prairie = new Scene();
    var c = new Controllable();
    //c.addEventHandlers(c);
    prairie.addFigure(c);
    animate();
    
    
    
    // http://socket.io/#how-to-use
    var socket = io.connect('http://gunfight.ca');
    socket.on('news', function (data) {
      console.log(data);
      socket.emit('my other event', { my: 'data' });
    });
      
});