GF.ClientLobbyHudFlow = (function () {
    var Screen = GF.ClientScreens.Screen;

    function render(options) {
        var isTouch = options.isTouchInterface();
        var activeScreen = getActiveScreen(options);

        show(options.gameHud, false);
        show(options.lobbyHud, true);

        if (activeScreen === Screen.LOBBY_EDIT_NAME) {
            renderNameEditor(options, isTouch);
            return activeScreen;
        }

        show(options.canvas, true);
        show(options.hudCanvas, true);
        options.nameEditorScreen.hide();

        if (activeScreen === Screen.HIGH_SCORES) {
            renderHighScoresScreen(options, isTouch);
            return activeScreen;
        }

        options.lobbyScreen.render(
            GF.ClientLobbyViewModel.getLobbyViewModel({
                isTouch: isTouch,
                localReadyRequested: options.localReadyRequested,
                model: options.model,
                playerId: options.playerId
            })
        );

        return activeScreen;
    }

    function getActiveScreen(options) {
        return GF.ClientScreens.getActiveScreen({
            roundState: options.roundState,
            nameEditorActive:
                options.nameEditor && options.nameEditor.isActive(),
            highScoresVisible: shouldShowHighScoresScreen(options)
        });
    }

    function shouldShowHighScoresScreen(options) {
        return GF.ClientLobbyViewModel.shouldShowHighScoresScreen({
            localReadyRequested: options.localReadyRequested,
            model: options.model
        });
    }

    function renderHighScoresScreen(options, isTouch) {
        options.highScoresScreen.render({
            rows:
                options.highScores && options.highScores.length
                    ? options.highScores
                    : [],
            playPrompt:
                shouldShowLobbyPrompt(options) && !isTouch
                    ? 'PRESS P TO PLAY'
                    : ''
        });
    }

    function shouldShowLobbyPrompt(options) {
        return GF.ClientLobbyViewModel.shouldShowLobbyPrompt({
            localReadyRequested: options.localReadyRequested,
            model: options.model,
            playerId: options.playerId
        });
    }

    function renderNameEditor(options, isTouch) {
        show(options.canvas, false);
        show(options.hudCanvas, false);
        options.lobbyScreen.clear();
        options.nameEditorScreen.render({
            state: options.nameEditor.getState(),
            helpLines: isTouch
                ? []
                : ['H J K L MOVE', 'SPACE SELECT', 'E DONE'],
            onSelect: options.onNameEditorSelect
        });
    }

    function show(element, visible) {
        if (element) {
            element.hidden = !visible;
        }
    }

    return {
        render: render
    };
})();
