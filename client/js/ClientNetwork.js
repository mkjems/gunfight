GF.ClientNetwork = function (options) {
    options = options || {};

    var storedPlayerName = options.getStoredPlayerName
        ? options.getStoredPlayerName()
        : '';
    var socket = io({
        auth: storedPlayerName
            ? {
                  name: storedPlayerName
              }
            : {}
    });

    socket.on('highScores', function (nextHighScores) {
        if (options.onHighScores) {
            options.onHighScores(nextHighScores);
        }
    });

    socket.on('joinedGame', function (data) {
        if (options.onJoinedGame) {
            options.onJoinedGame(data);
        }
    });

    socket.on('keyEvent', function (keyEvent) {
        if (options.onKeyEvent) {
            options.onKeyEvent(keyEvent);
        }
    });

    socket.on('playerPosition', function (data) {
        if (options.onPlayerPosition) {
            options.onPlayerPosition(data);
        }
    });

    socket.on('obstacleDamage', function (data) {
        if (options.onObstacleDamage) {
            options.onObstacleDamage(data);
        }
    });

    socket.on('newClient', function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    socket.on('modelUpdate', function (model) {
        if (options.onModelUpdate) {
            options.onModelUpdate(model);
        }
    });

    return {
        socket: socket
    };
};
