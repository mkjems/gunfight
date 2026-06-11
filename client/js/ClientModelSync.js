GF.ClientModelSync = (function () {
    function getLocalClient(model, playerId) {
        if (!model) {
            return null;
        }

        return (
            (model.clients || []).find(function (client) {
                return client.id === playerId;
            }) || null
        );
    }

    function shouldClearLocalReadyRequest(model, playerId) {
        var client = getLocalClient(model, playerId);

        return !!(client && !client.ready);
    }

    function didAnyClientBecomeReady(previousModel, model) {
        var previousReady = {};

        if (!previousModel || !model) {
            return false;
        }

        (previousModel.clients || []).forEach(function (client) {
            previousReady[client.id] = client.ready;
        });

        return (model.clients || []).some(function (client) {
            return client.ready && !previousReady[client.id];
        });
    }

    function isReadyToStart(model) {
        return (
            !!model &&
            model.clients.length >= 2 &&
            model.clients.every(function (client) {
                return client.ready;
            })
        );
    }

    function analyze(previousModel, model, playerId) {
        return {
            abandoned: model && model.status === 'abandoned',
            clearLocalReadyRequest: shouldClearLocalReadyRequest(
                model,
                playerId
            ),
            clientBecameReady: didAnyClientBecomeReady(previousModel, model),
            readyToStart: isReadyToStart(model)
        };
    }

    return {
        analyze: analyze,
        getLocalClient: getLocalClient,
        isReadyToStart: isReadyToStart
    };
})();
