GF.ClientTimers = function () {
    var timers = {};

    function set(name, callback, delay) {
        clear(name);

        timers[name] = setTimeout(function () {
            timers[name] = null;
            callback();
        }, delay);
    }

    function has(name) {
        return !!timers[name];
    }

    function clear(name) {
        if (!timers[name]) {
            return;
        }

        clearTimeout(timers[name]);
        timers[name] = null;
    }

    function clearMany(names) {
        names.forEach(clear);
    }

    function clearAll() {
        Object.keys(timers).forEach(clear);
    }

    return {
        clear: clear,
        clearAll: clearAll,
        clearMany: clearMany,
        has: has,
        set: set
    };
};
