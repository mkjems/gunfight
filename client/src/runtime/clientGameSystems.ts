type BulletConstructor<TBullet> = {
    onRicochet?: ((bullet: TBullet) => void) | null;
};

type ClientGameSystemsOptions<
    TBullet,
    TScene,
    TBullets,
    TPlayers,
    TRoundIntro,
    TAmmo,
    TPositionSync,
    TRoundData,
    TScoreKeeper,
    TTimers,
    TRoundState
> = {
    Bullet: BulletConstructor<TBullet>;
    createAmmo: () => TAmmo;
    createBullets: (scene: TScene) => TBullets;
    createPlayers: (scene: TScene, bullets: TBullets) => TPlayers;
    createPositionSync: () => TPositionSync;
    createRoundData: () => TRoundData;
    createRoundIntro: (players: TPlayers) => TRoundIntro;
    createScene: () => TScene;
    createScoreKeeper: () => TScoreKeeper;
    createTimers: () => TTimers;
    initialRoundState: TRoundState;
    playRicochet: () => void;
};

export function create<
    TBullet,
    TScene,
    TBullets,
    TPlayers,
    TRoundIntro,
    TAmmo,
    TPositionSync,
    TRoundData,
    TScoreKeeper,
    TTimers,
    TRoundState
>(
    options: ClientGameSystemsOptions<
        TBullet,
        TScene,
        TBullets,
        TPlayers,
        TRoundIntro,
        TAmmo,
        TPositionSync,
        TRoundData,
        TScoreKeeper,
        TTimers,
        TRoundState
    >
) {
    const scene = options.createScene();
    const bullets = options.createBullets(scene);
    const players = options.createPlayers(scene, bullets);
    const roundIntro = options.createRoundIntro(players);

    options.Bullet.onRicochet = options.playRicochet;

    return {
        ammo: options.createAmmo(),
        bullets,
        highScores: [],
        localReadyRequested: false,
        players,
        positionSync: options.createPositionSync(),
        roundData: options.createRoundData(),
        roundIntro,
        roundState: options.initialRoundState,
        scene,
        scoreKeeper: options.createScoreKeeper(),
        timers: options.createTimers()
    };
}

export const ClientGameSystems = {
    create
};
