GF.ClientLobbyViewModel = (function () {
    var controls = [
        'h j k l - left down up right',
        'a z - aim up down',
        'Space - shoot'
    ];

    function getClientName(client) {
        return client.name || 'PLAYER ' + ((client.slot || 0) + 1);
    }

    function getLocalClient(model, playerId) {
        var clients = (model && model.clients) || [];

        return (
            clients.find(function (client) {
                return client.id === playerId;
            }) || null
        );
    }

    function isLocalClientReady(options) {
        var client = getLocalClient(options.model, options.playerId);

        return options.localReadyRequested || !!(client && client.ready);
    }

    function isLocalClientWaiting(options) {
        var client = getLocalClient(options.model, options.playerId);

        return !!(
            client &&
            !isLocalClientReady(options) &&
            options.model &&
            options.model.status !== 'abandoned'
        );
    }

    function shouldShowLobbyPrompt(options) {
        return (
            (!options.model || options.model.status !== 'abandoned') &&
            !isLocalClientReady(options)
        );
    }

    function shouldShowHighScoresScreen(options) {
        var clients = (options.model && options.model.clients) || [];
        var hasReadyClient = clients.some(function (client) {
            return client.ready;
        });
        var now = options.now || new Date().getTime();

        if (hasReadyClient || options.localReadyRequested) {
            return false;
        }

        return Math.floor(now / 7000) % 2 === 1;
    }

    function getLobbyPlayerLabel(model, playerId) {
        var client = getLocalClient(model, playerId);
        var playerIndex;

        if (!model || !client) {
            return '';
        }

        playerIndex = (model.clients || []).findIndex(function (item) {
            return item.id === playerId;
        });

        return 'PLAYER ' + (playerIndex + 1) + ' - ' + getClientName(client);
    }

    function getGameLabel(model) {
        if (!model || !model.gameId) {
            return '';
        }

        return 'GAME ' + model.gameId;
    }

    function getLobbySlots(model) {
        var slots = [];
        var model = model || {};
        var clients = model.clients || [];
        var playerLimit = model.playerLimit || Math.max(2, clients.length);
        var i;

        for (i = 0; i < playerLimit; i++) {
            slots.push(clients[i] || null);
        }

        return slots;
    }

    function getLobbySlotViewModels(options) {
        return getLobbySlots(options.model).map(function (client, index) {
            return {
                label: getLobbySlotLabel(
                    client,
                    index,
                    getOpponentSlotMessage(options.model)
                ),
                ready: !!(client && client.ready)
            };
        });
    }

    function getLobbySlotLabel(client, index, opponentMessage) {
        if (!client) {
            if (opponentMessage) {
                return 'PLAYER ' + (index + 1) + ' : ' + opponentMessage;
            }

            return 'PLAYER ' + (index + 1) + ' : WAITING';
        }

        return (
            'PLAYER ' +
            (index + 1) +
            ' - ' +
            getClientName(client) +
            ' : ' +
            (client.ready ? 'READY' : 'WAITING')
        );
    }

    function getOpponentSlotMessage(model) {
        var message = getLobbyMessage(model);

        return isOpponentSlotMessage(message) ? message : '';
    }

    function isOpponentSlotMessage(message) {
        return (
            message === 'LOOKING FOR CHALLENGER' || message === 'OPPONENT LEFT'
        );
    }

    function getLobbyMessage(model) {
        if (model && model.message) {
            return model.message;
        }

        return '';
    }

    function getLobbyViewModel(options) {
        var isTouch = options.isTouch;
        var localClientWaiting = isLocalClientWaiting(options);
        var showPlayPrompt = shouldShowLobbyPrompt(options) && !isTouch;

        return {
            identityLines: [
                getLobbyPlayerLabel(options.model, options.playerId),
                getGameLabel(options.model)
            ],
            controls: isTouch ? [] : controls,
            showControls: !isTouch,
            slots: getLobbySlotViewModels(options),
            showEditPrompt: !isTouch && localClientWaiting,
            editPrompt:
                !isTouch && localClientWaiting ? 'PRESS E TO EDIT NAME' : '',
            playPrompt: showPlayPrompt ? 'PRESS P TO PLAY' : ''
        };
    }

    return {
        getClientName: getClientName,
        getLobbyViewModel: getLobbyViewModel,
        getLocalClient: getLocalClient,
        isLocalClientReady: isLocalClientReady,
        isLocalClientWaiting: isLocalClientWaiting,
        shouldShowHighScoresScreen: shouldShowHighScoresScreen,
        shouldShowLobbyPrompt: shouldShowLobbyPrompt
    };
})();
