GF.ClientRoundTransition = (function () {
    function resolve(options) {
        if (!options.canTransition(options.currentState, options.nextState)) {
            throw new Error(
                'Illegal round state transition: ' +
                    options.currentState +
                    ' -> ' +
                    options.nextState
            );
        }

        return options.nextState;
    }

    return {
        resolve: resolve
    };
})();
