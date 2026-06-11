GF.ClientInputStartup = (function () {
    function start(options) {
        var inputController = options.inputController;

        if (inputController) {
            return inputController;
        }

        inputController = options.createInputController();
        options.initTouchControls();
        options.startGameLoop();

        return inputController;
    }

    return {
        start: start
    };
})();
