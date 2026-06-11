GF.ClientHudFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function render(options) {
        var firstClient;
        var secondClient;

        options.hudContext.clearRect(
            0,
            0,
            options.hudCanvas.width,
            options.hudCanvas.height
        );

        if (options.roundState === RoundState.WAITING) {
            options.renderLobbyHud();
            options.updateTouchControls();
            return;
        }

        show(options.canvas, true);
        show(options.hudCanvas, true);
        show(options.gameHud, true);
        show(options.lobbyHud, false);

        firstClient = options.model && options.model.clients[0];
        secondClient = options.model && options.model.clients[1];

        renderGameHud(options);

        if (!firstClient || !secondClient) {
            return;
        }

        options.ammoHudRenderer.render(
            options.ammo.get(firstClient.id),
            122,
            606,
            1
        );
        options.ammoHudRenderer.render(
            options.ammo.get(secondClient.id),
            828,
            606,
            -1
        );
        options.updateTouchControls();
    }

    function renderGameHud(options) {
        options.gameHudScreen.render(
            GF.GameHudViewModel.getState({
                camera: options.camera,
                cameraController: options.cameraController,
                defaultSeconds: options.defaultSeconds,
                players: options.players,
                roundData: options.roundData,
                roundState: options.roundState,
                scoreKeeper: options.scoreKeeper
            })
        );
    }

    function show(element, visible) {
        if (element) {
            element.hidden = !visible;
        }
    }

    return {
        render: render,
        renderGameHud: renderGameHud
    };
})();
