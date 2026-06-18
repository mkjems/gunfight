type BulletConstructor<TBullet> = {
    onRicochet?: ((bullet: TBullet) => void) | null;
};

type ClientGameSystemsOptions<
    TBullet,
    TScene,
    TBullets,
    TPlayers,
    TDuelIntro,
    TAmmo,
    TParticleLayer,
    TPositionSync,
    TDuelData,
    TScoreKeeper,
    TTimers,
    TDuelState
> = {
    Bullet: BulletConstructor<TBullet>;
    createAmmo: () => TAmmo;
    createBullets: (scene: TScene) => TBullets;
    createParticleLayer: () => TParticleLayer;
    createPlayers: (scene: TScene, bullets: TBullets) => TPlayers;
    createPositionSync: () => TPositionSync;
    createDuelData: () => TDuelData;
    createDuelIntro: (players: TPlayers) => TDuelIntro;
    createScene: () => TScene;
    createScoreKeeper: () => TScoreKeeper;
    createTimers: () => TTimers;
    initialDuelState: TDuelState;
    playRicochet: (bullet?: TBullet) => void;
};

export function create<
    TBullet,
    TScene,
    TBullets,
    TPlayers,
    TDuelIntro,
    TAmmo,
    TParticleLayer,
    TPositionSync,
    TDuelData,
    TScoreKeeper,
    TTimers,
    TDuelState
>(
    options: ClientGameSystemsOptions<
        TBullet,
        TScene,
        TBullets,
        TPlayers,
        TDuelIntro,
        TAmmo,
        TParticleLayer,
        TPositionSync,
        TDuelData,
        TScoreKeeper,
        TTimers,
        TDuelState
    >
) {
    const scene = options.createScene();
    const bullets = options.createBullets(scene);
    const players = options.createPlayers(scene, bullets);
    const duelIntro = options.createDuelIntro(players);

    options.Bullet.onRicochet = options.playRicochet;

    return {
        ammo: options.createAmmo(),
        bullets,
        highScores: [],
        localReadyRequested: false,
        particleLayer: options.createParticleLayer(),
        players,
        positionSync: options.createPositionSync(),
        duelData: options.createDuelData(),
        duelIntro,
        duelState: options.initialDuelState,
        scene,
        scoreKeeper: options.createScoreKeeper(),
        timers: options.createTimers()
    };
}

export const ClientGameSystems = {
    create
};
