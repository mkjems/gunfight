import { Bullet } from './bullet.js';
import { ClientCollisionEnvironment } from './clientCollisionEnvironment.js';
import { Obstacles } from './obstacles.js';
import type { RoundState } from '../state/clientScreens.js';

type RuntimeCollisionLines = Parameters<typeof Bullet.setCollisionLines>[0];
type RuntimeObstacleBodies = Parameters<typeof Obstacles.setBodies>[0];

type RuntimeCollisionEnvironmentOptions = {
    roundState: RoundState;
    scenario: unknown | null | undefined;
    scenarioRenderer: {
        getObstacleBodies: (
            scenario: unknown | null | undefined
        ) => RuntimeObstacleBodies;
        getRockLines: (
            scenario: unknown | null | undefined
        ) => RuntimeCollisionLines;
    };
};

export function updateBulletLines(options: RuntimeCollisionEnvironmentOptions) {
    ClientCollisionEnvironment.updateBulletLines({
        Bullet,
        Obstacles,
        roundState: options.roundState,
        scenario: options.scenario,
        scenarioRenderer: options.scenarioRenderer
    });
}

export function updateObstacleBodies(
    options: RuntimeCollisionEnvironmentOptions
) {
    ClientCollisionEnvironment.updateObstacleBodies({
        Bullet,
        Obstacles,
        roundState: options.roundState,
        scenario: options.scenario,
        scenarioRenderer: options.scenarioRenderer
    });
}

export const ClientRuntimeCollisionEnvironment = {
    updateBulletLines,
    updateObstacleBodies
};
