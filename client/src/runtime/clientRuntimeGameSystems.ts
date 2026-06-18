import { Bullet } from '../engine/bullet.js';
import { Bullets } from '../engine/bullets.js';
import { ClientAmmo } from '../engine/clientAmmo.js';
import { ClientGameSystems } from './clientGameSystems.js';
import { ClientDuelState } from '../state/clientDuelState.js';
import { ClientTimers } from '../state/clientTimers.js';
import { PlayerPositionSync } from '../network/playerPositionSync.js';
import { ParticleLayer } from '../engine/particleLayer.js';
import { Players } from '../engine/players.js';
import { DuelIntro } from '../engine/duelIntro.js';
import { Scene } from '../engine/scene.js';
import { ScoreKeeper } from '../engine/scoreKeeper.js';

type ClientRuntimeGameSystemsOptions = {
    initialDuelState: unknown;
    playRicochet: (bullet?: Bullet) => void;
};

export function create(options: ClientRuntimeGameSystemsOptions) {
    return ClientGameSystems.create({
        Bullet,
        createAmmo: () => ClientAmmo(),
        createBullets: (scene: Scene) => new Bullets(scene),
        createParticleLayer: () => new ParticleLayer(),
        createPlayers: (scene: Scene, bullets: Bullets) =>
            new Players(scene, bullets),
        createPositionSync: () => PlayerPositionSync(),
        createDuelData: () => ClientDuelState(),
        createDuelIntro: (players: Players) => DuelIntro({ players }),
        createScene: () => new Scene(),
        createScoreKeeper: () => ScoreKeeper(),
        createTimers: () => ClientTimers(),
        initialDuelState: options.initialDuelState,
        playRicochet: options.playRicochet
    });
}

export const ClientRuntimeGameSystems = {
    create
};
