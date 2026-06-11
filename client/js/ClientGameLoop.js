GF.ClientGameLoop = function (options) {
    options = options || {};

    var scheduleFrame =
        options.scheduleFrame ||
        function (callback) {
            setTimeout(function () {
                requestAnimFrame(callback);
            }, 0);
        };
    var running = false;

    function start() {
        if (running) {
            return false;
        }

        running = true;
        tick();

        return true;
    }

    function tick() {
        if (!running) {
            return;
        }

        options.update();
        options.render();
        scheduleFrame(tick);
    }

    function stop() {
        running = false;
    }

    return {
        start: start,
        stop: stop,
        tick: tick
    };
};
