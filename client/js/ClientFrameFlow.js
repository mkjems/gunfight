GF.ClientFrameFlow = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function update(options) {
        options.updateBulletCollisionEnvironment();
        options.updateMovementObstacleEnvironment();
        options.scene.moveAll();
        options.roundIntro.update();
        options.syncLocalPlayerPosition();
        options.checkForHits();
        options.updateCamera();
    }

    function render(options) {
        options.context.clearRect(
            0,
            0,
            options.canvas.width,
            options.canvas.height
        );
        options.context.save();

        if (options.shouldUseCamera()) {
            options.camera.apply(options.context);
        }

        if (options.roundState !== RoundState.WAITING) {
            options.drawScenario();
        }

        options.scene.drawAll(options.context);
        options.drawCollisionBodies();
        options.context.restore();
        options.renderHud();
        options.updateTouchControls();
    }

    return {
        render: render,
        update: update
    };
})();
