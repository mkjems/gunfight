type ScheduleFrame = (callback: () => void) => void;

type ClientGameLoopOptions = {
    render: () => void;
    scheduleFrame?: ScheduleFrame;
    update: () => void;
};

type GlobalWithRequestFrame = typeof globalThis & {
    requestAnimFrame?: (callback: () => void) => void;
};

export function ClientGameLoop(options: ClientGameLoopOptions) {
    const scheduleFrame =
        options.scheduleFrame ||
        function (callback: () => void) {
            setTimeout(function () {
                const requestFrame = (globalThis as GlobalWithRequestFrame)
                    .requestAnimFrame;

                if (requestFrame) {
                    requestFrame(callback);
                    return;
                }

                requestAnimationFrame(callback);
            }, 0);
        };
    let running = false;

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
        start,
        stop,
        tick
    };
}
