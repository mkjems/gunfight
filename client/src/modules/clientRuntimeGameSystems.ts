import { Bullet } from './bullet.js';
import { Bullets } from './bullets.js';
import { ClientAmmo } from './clientAmmo.js';
import { ClientGameSystems } from './clientGameSystems.js';
import { ClientRoundState } from './clientRoundState.js';
import { ClientTimers } from './clientTimers.js';
import { PlayerPositionSync } from './playerPositionSync.js';
import { Players } from './players.js';
import { RoundIntro } from './roundIntro.js';
import { Scene } from './scene.js';
import { ScoreKeeper } from './scoreKeeper.js';

type ClientRuntimeGameSystemsOptions = {
    initialRoundState: unknown;
    playRicochet: () => void;
};

export function create(options: ClientRuntimeGameSystemsOptions) {
    return ClientGameSystems.create({
        Bullet: Bullet as any,
        Bullets: Bullets as any,
        ClientAmmo: ClientAmmo as any,
        ClientRoundState: ClientRoundState as any,
        ClientTimers: ClientTimers as any,
        PlayerPositionSync: PlayerPositionSync as any,
        Players: Players as any,
        RoundIntro: RoundIntro as any,
        Scene: Scene as any,
        ScoreKeeper: ScoreKeeper as any,
        initialRoundState: options.initialRoundState,
        playRicochet: options.playRicochet
    });
}

export const ClientRuntimeGameSystems = {
    create
};
