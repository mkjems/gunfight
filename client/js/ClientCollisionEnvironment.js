GF.ClientCollisionEnvironment = (function () {
    var RoundState = GF.ClientScreens.RoundState;

    function updateBulletLines(options) {
        options.Bullet.setCollisionLines(
            options.scenarioRenderer.getRockLines(options.scenario)
        );
    }

    function updateObstacleBodies(options) {
        var scenario =
            options.roundState === RoundState.WAITING ? null : options.scenario;

        options.Obstacles.setBodies(
            options.scenarioRenderer.getObstacleBodies(scenario)
        );
    }

    return {
        updateBulletLines: updateBulletLines,
        updateObstacleBodies: updateObstacleBodies
    };
})();
