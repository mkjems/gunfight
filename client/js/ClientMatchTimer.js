GF.ClientMatchTimer = (function () {
    function scheduleEnd(options) {
        var roundEndsAt = options.roundData.getRoundEndsAt();
        var now = options.now || defaultNow;
        var delay;

        if (!roundEndsAt) {
            return false;
        }

        delay = Math.max(0, roundEndsAt - now());
        options.timers.set('matchEnd', options.endGame, delay);

        return true;
    }

    function defaultNow() {
        return new Date().getTime();
    }

    return {
        scheduleEnd: scheduleEnd
    };
})();
