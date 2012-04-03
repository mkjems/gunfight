

var express = require('express'),
    mustache =require('mustache'),
    portNumber = '843';

var app = express.createServer();


app.configure(function(){
    //app.use(express.methodOverride());
    app.use(express.logger('dev')); // { format: ':method :url' }
    app.use(express.bodyParser());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(app.router);
    app.use(express.static(__dirname + '/../www'));
    // view engine
    app.set('views', __dirname + '/../www');
    app.set('view options', {layout: false});    
    app.register('.html',{
        compile: function(str, options) {
            return function(env) {
                return mustache.to_html(str, env.locals);
            };
        }
    });
});


app.get('/', function(req, res){
    console.log();
    res.render('index.html');
});

app.get('/api', function(req, res){
    res.send('Hello World, Api here');
});

var io = require('socket.io').listen(app);
app.listen(portNumber);

console.log('Gunfight gameserver running on port: '+ portNumber +', http://localhost:' + portNumber);


/*Socket.io */

var model = {
    numPlayers:0,
    players: []
};

function getModel(){
    model.time = new Date().getTime();
    return model;
}

io.sockets.on('connection', function (socket) {
    model.numPlayers += 1;
    console.log('numPlayers', model.numPlayers);
    
    socket.on('disconnect', function (data) {
        model.numPlayers -= 1;
        socket.broadcast.emit('modelUpdate', getModel());
        console.log(data);
    }); 
     
    //socket.broadcast.emit('modelUpdate', getModel()); // Tell the others
    //socket.emit('modelUpdate', getModel()); // tell this socket;
    
    // time sync
    socket.on('syncServerTime', function (timeData) {
        var st = new Date().getTime();
        timeData.serverTime = st;
        socket.emit('finishSyncTime', timeData);
    });
    socket.emit('startSyncTime');
              
});

function callDrawAfterRandomPause(){
    var pause = Math.floor(Math.random()*1000) + 2000;
    
    setTimeout(function(){
        io.sockets.emit('planEvent', {
            nextEventTime: new Date().getTime() + 150,
            x: Math.floor(Math.random()*300),
            y: Math.floor(Math.random()*300)
        }); 
        callDrawAfterRandomPause();   
    },pause);
}
callDrawAfterRandomPause();

console.log('Socket.io server running...');
