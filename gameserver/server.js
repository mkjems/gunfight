const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const model = require('./gameModules/gfmodel');

const portNumber = process.env.PORT || 8080;
const wwwRoot = path.join(__dirname, '..', 'www');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(wwwRoot));

app.get('/api', function(req, res) {
  res.send('Hello World, Api here');
});

app.get('/', function(req, res) {
  res.sendFile(path.join(wwwRoot, 'index.html'));
});

io.on('connection', function(socket) {
  const client = model.getNewClient();

  socket.on('disconnect', function(reason) {
    model.disconnect(client);
    io.emit('modelUpdate', model.getModel());
    console.log('client disconnected', client.id, reason);
  });

  socket.on('clientKeyEvent', function(data) {
    const keyEvent = {
      eventTime: new Date().getTime(),
      action: data.action,
      eventName: 'clientKeyEvent',
      key: data.key,
      player: data.player
    };

    socket.broadcast.emit('keyEvent', keyEvent);
    socket.emit('keyEvent', keyEvent);
  });

  socket.on('clientReady', function() {
    model.readyClient(client);
    io.emit('modelUpdate', model.getModel());
  });

  socket.on('resetReady', function() {
    model.resetReady();
    io.emit('modelUpdate', model.getModel());
  });

  socket.on('syncServerTime', function(timeData) {
    timeData.serverTime = new Date().getTime();
    timeData.playerId = client.id;
    timeData.model = model.getModel();
    socket.emit('finishSyncTime', timeData);
    socket.broadcast.emit('newClient', model.getModel());
  });
});

server.listen(portNumber, function() {
  console.log('Gunfight gameserver running on port: ' + portNumber + ', http://localhost:' + portNumber);
  console.log('Socket.io server running...');
});
