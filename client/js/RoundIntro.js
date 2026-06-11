GF.RoundIntro = function (options) {
    options = options || {};

    var players = options.players;
    var intro = null;

    function start() {
        var startedAt = new Date().getTime();
        var duration = GF.Config.round.introWalkDelay;
        var targets = [];

        players.clearKeys();

        Object.keys(players.all).forEach(function (id) {
            var player = players.all[id];
            var slot =
                GF.Config.player.slots[
                    player.slot % GF.Config.player.slots.length
                ];
            var bounds;

            player.resetTo(slot);
            bounds = player.getBounds();

            targets.push({
                player: player,
                fromX: slot.facing > 0 ? bounds.minX : bounds.maxX,
                fromY: slot.y,
                toX: slot.x,
                toY: slot.y,
                idleFrame: slot.frame
            });
        });

        intro = {
            startedAt: startedAt,
            duration: duration,
            targets: targets
        };

        update();
    }

    function update() {
        var elapsed;
        var progress;
        var eased;

        if (!intro) {
            return;
        }

        elapsed = new Date().getTime() - intro.startedAt;
        progress = Math.min(1, Math.max(0, elapsed / intro.duration));
        eased = 1 - Math.pow(1 - progress, 3);

        intro.targets.forEach(function (target) {
            var player = target.player;

            player.x = target.fromX + (target.toX - target.fromX) * eased;
            player.y = target.fromY + (target.toY - target.fromY) * eased;
            player.frame =
                player.animationFrames[
                    Math.floor(elapsed / (player.animationFrameTime * 1000)) %
                        player.animationFrames.length
                ];
        });

        if (progress >= 1) {
            complete();
        }
    }

    function complete() {
        if (!intro) {
            return;
        }

        intro.targets.forEach(function (target) {
            target.player.x = target.toX;
            target.player.y = target.toY;
            target.player.frame = target.idleFrame;
        });

        intro = null;
    }

    function clear() {
        intro = null;
    }

    return {
        clear: clear,
        complete: complete,
        start: start,
        update: update
    };
};
