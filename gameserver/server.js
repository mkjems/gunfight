

var express = require('express'),
    mustache =require('mustache'),
    portNumber = '3000';

var app = express.createServer();
var io = require('socket.io').listen(app)

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
    // Logging

});


app.get('/', function(req, res){
    console.log();
    res.render('index.html');
});

app.get('/api', function(req, res){
    res.send('Hello World, Api here');
});


app.listen(portNumber);

console.log('Gunfight gameserver running on port: '+ portNumber +', http://localhost:' + portNumber);


/*Socket.io */

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

console.log('Socket.io server running...');
