import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import * as model from './gameModules/gfmodel.js';

const portNumber = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

  socket.emit('joinedGame', {
    playerId: client.id,
    model: model.getModel()
  });
  socket.broadcast.emit('newClient', model.getModel());

  socket.on('disconnect', function(reason) {
    model.disconnect(client);
    io.emit('modelUpdate', model.getModel());
    console.log('client disconnected', client.id, reason);
  });

  socket.on('clientKeyEvent', function(data) {
    const keyEvent = {
      action: data.action,
      key: data.key,
      player: client.id,
      shot: data.shot
    };

    socket.broadcast.emit('keyEvent', keyEvent);
  });

  socket.on('clientReady', function() {
    model.readyClient(client);
    io.emit('modelUpdate', model.getModel());
  });

  socket.on('resetReady', function() {
    model.resetReady();
    io.emit('modelUpdate', model.getModel());
  });

  socket.on('advanceRound', function() {
    model.advanceRound();
    io.emit('modelUpdate', model.getModel());
  });

});

server.listen(portNumber, function() {
  console.log('Gunfight gameserver running on port: ' + portNumber + ', http://localhost:' + portNumber);
  console.log('Socket.io server running...');
});
