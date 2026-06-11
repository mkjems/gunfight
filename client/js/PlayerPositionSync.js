GF.PlayerPositionSync = function (options) {
    options = options || {};

    var lastPositionSyncAt = 0;
    var getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    var syncInterval = options.syncInterval || 80;

    function syncLocal(options) {
        var now = getTime();
        var player = options.player;
        var socket = options.socket;

        if (
            !options.playing ||
            !player ||
            !socket ||
            now - lastPositionSyncAt < syncInterval
        ) {
            return false;
        }

        lastPositionSyncAt = now;
        socket.emit('playerPosition', {
            x: player.x,
            y: player.y,
            frame: player.frame,
            aim: player.aim,
            facing: player.facing
        });

        return true;
    }

    function applyRemote(options) {
        var data = options.data;
        var player;

        if (
            !data ||
            !options.playing ||
            data.player === options.localPlayerId ||
            !options.players ||
            !options.players.all
        ) {
            return false;
        }

        player = options.players.all[data.player];

        if (!player) {
            return false;
        }

        player.x = data.x;
        player.y = data.y;
        player.frame = data.frame;
        player.aim = data.aim;
        player.facing = data.facing;

        return true;
    }

    return {
        applyRemote: applyRemote,
        syncLocal: syncLocal
    };
};
