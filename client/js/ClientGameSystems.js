GF.ClientGameSystems = (function () {
    function create(options) {
        var scene = new options.Scene();
        var bullets = new options.Bullets(scene);
        var players = new options.Players(scene, bullets);
        var roundIntro = new options.RoundIntro({
            players: players
        });

        options.Bullet.onRicochet = options.playRicochet;

        return {
            ammo: new options.ClientAmmo(),
            bullets: bullets,
            highScores: [],
            localReadyRequested: false,
            players: players,
            positionSync: new options.PlayerPositionSync(),
            roundData: new options.ClientRoundState(),
            roundIntro: roundIntro,
            roundState: options.initialRoundState,
            scene: scene,
            scoreKeeper: new options.ScoreKeeper(),
            timers: new options.ClientTimers()
        };
    }

    return {
        create: create
    };
})();
