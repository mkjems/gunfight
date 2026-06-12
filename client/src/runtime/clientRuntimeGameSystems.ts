import { Bullet } from '../engine/bullet.js';
import { Bullets } from '../engine/bullets.js';
import { ClientAmmo } from '../engine/clientAmmo.js';
import { ClientGameSystems } from './clientGameSystems.js';
import { ClientRoundState } from '../state/clientRoundState.js';
import { ClientTimers } from '../state/clientTimers.js';
import { PlayerPositionSync } from '../network/playerPositionSync.js';
import { Players } from '../engine/players.js';
import { RoundIntro } from '../engine/roundIntro.js';
import { Scene } from '../engine/scene.js';
import { ScoreKeeper } from '../engine/scoreKeeper.js';

type ClientRuntimeGameSystemsOptions = {
    initialRoundState: unknown;
    playRicochet: () => void;
};

export function create(options: ClientRuntimeGameSystemsOptions) {
    return ClientGameSystems.create({
        Bullet,
        createAmmo: () => ClientAmmo(),
        createBullets: (scene: Scene) => new Bullets(scene),
        createPlayers: (scene: Scene, bullets: Bullets) =>
            new Players(scene, bullets),
        createPositionSync: () => PlayerPositionSync(),
        createRoundData: () => ClientRoundState(),
        createRoundIntro: (players: Players) => RoundIntro({ players }),
        createScene: () => new Scene(),
        createScoreKeeper: () => ScoreKeeper(),
        createTimers: () => ClientTimers(),
        initialRoundState: options.initialRoundState,
        playRicochet: options.playRicochet
    });
}

export const ClientRuntimeGameSystems = {
    create
};
