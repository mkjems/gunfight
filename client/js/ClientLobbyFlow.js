GF.ClientLobbyFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;
    var LOBBY_ENTRY_TIMERS = ['ritual', 'hit', 'reset', 'abandonedRequeue'];

    function enter(options) {
        options.timers.clearMany(LOBBY_ENTRY_TIMERS);
        options.roundIntro.clear();
        options.roundData.resetRoundFlags();
        options.setRoundState(RoundState.WAITING);
        options.scoreKeeper.resetRecordedResult();
        options.players.clearKeys();
        options.bullets.clear();
        options.syncNameEditor();
    }

    function scheduleAbandonedRequeue(options) {
        if (options.timers.has('abandonedRequeue') || !options.socket) {
            return false;
        }

        options.timers.set(
            'abandonedRequeue',
            function () {
                options.socket.emit('requeue');
            },
            GF.Config.round.abandonedRequeueDelay
        );

        return true;
    }

    function clearAbandonedRequeue(options) {
        options.timers.clear('abandonedRequeue');
    }

    return {
        clearAbandonedRequeue: clearAbandonedRequeue,
        enter: enter,
        scheduleAbandonedRequeue: scheduleAbandonedRequeue
    };
})();
