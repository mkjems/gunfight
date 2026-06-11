type Constructor<T> = new (...args: any[]) => T;

type BulletConstructor = {
    onRicochet?: () => void;
};

type ClientGameSystemsOptions = {
    Bullet: BulletConstructor;
    Bullets: Constructor<unknown>;
    ClientAmmo: Constructor<unknown>;
    ClientRoundState: Constructor<unknown>;
    ClientTimers: Constructor<unknown>;
    initialRoundState: unknown;
    PlayerPositionSync: Constructor<unknown>;
    Players: Constructor<unknown>;
    playRicochet: () => void;
    RoundIntro: Constructor<unknown>;
    Scene: Constructor<unknown>;
    ScoreKeeper: Constructor<unknown>;
};

export function create(options: ClientGameSystemsOptions) {
    const scene = new options.Scene();
    const bullets = new options.Bullets(scene);
    const players = new options.Players(scene, bullets);
    const roundIntro = new options.RoundIntro({
        players
    });

    options.Bullet.onRicochet = options.playRicochet;

    return {
        ammo: new options.ClientAmmo(),
        bullets,
        highScores: [],
        localReadyRequested: false,
        players,
        positionSync: new options.PlayerPositionSync(),
        roundData: new options.ClientRoundState(),
        roundIntro,
        roundState: options.initialRoundState,
        scene,
        scoreKeeper: new options.ScoreKeeper(),
        timers: new options.ClientTimers()
    };
}

export const ClientGameSystems = {
    create
};
