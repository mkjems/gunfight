import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { createLobby } from './gameModules/lobby.js';

const portNumber = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wwwRoot = path.join(__dirname, '..', 'www');
const lobby = createLobby();

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

function getSocketGameContext(socket){
  const game = lobby.getGameForSocket(socket.id);
  const client = lobby.getClientForSocket(socket.id);

  if(!game || !client){
    return null;
  }

  return {
    client: client,
    game: game
  };
}

function emitGameModel(game, eventName){
  io.to(game.room).emit(eventName || 'modelUpdate', lobby.getModel(game));
}

function isReadyToStart(model){
  return model.clients.length >= 2 && model.clients.every(function(client){
    return client.ready;
  });
}

io.on('connection', function(socket) {
  const joined = lobby.join(socket.id);
  const client = joined.client;
  const game = joined.game;

  socket.join(game.room);

  socket.emit('joinedGame', {
    playerId: client.id,
    model: joined.model
  });
  socket.to(game.room).emit('newClient', lobby.getModel(game));

  socket.on('disconnect', function(reason) {
    const left = lobby.leave(socket.id);

    if(left && left.model){
      emitGameModel(left.game);
    }

    console.log('client disconnected', client.id, reason);
  });

  socket.on('clientKeyEvent', function(data) {
    const context = getSocketGameContext(socket);

    if(!context){
      return;
    }

    const keyEvent = {
      action: data.action,
      key: data.key,
      player: context.client.id,
      shot: data.shot
    };

    socket.to(context.game.room).emit('keyEvent', keyEvent);
  });

  socket.on('playerPosition', function(data) {
    const context = getSocketGameContext(socket);

    if(!context){
      return;
    }

    socket.to(context.game.room).emit('playerPosition', {
      player: context.client.id,
      x: data.x,
      y: data.y,
      frame: data.frame,
      aim: data.aim,
      facing: data.facing
    });
  });

  socket.on('obstacleDamage', function(data) {
    const context = getSocketGameContext(socket);

    if(!context){
      return;
    }

    socket.to(context.game.room).emit('obstacleDamage', data);
  });

  socket.on('clientReady', function() {
    const context = getSocketGameContext(socket);
    let model;

    if(!context){
      return;
    }

    context.game.model.readyClient(context.client);
    model = lobby.getModel(context.game);

    if(isReadyToStart(model)){
      lobby.markPlaying(context.game);
    }

    emitGameModel(context.game);
  });

  socket.on('resetReady', function() {
    const context = getSocketGameContext(socket);

    if(!context){
      return;
    }

    context.game.model.resetReady();
    lobby.refreshStatus(context.game);
    emitGameModel(context.game);
  });

  socket.on('advanceRound', function() {
    const context = getSocketGameContext(socket);

    if(!context){
      return;
    }

    context.game.model.advanceRound();
    emitGameModel(context.game);
  });

});

server.listen(portNumber, function() {
  console.log('Gunfight gameserver running on port: ' + portNumber + ', http://localhost:' + portNumber);
  console.log('Socket.io server running...');
});
