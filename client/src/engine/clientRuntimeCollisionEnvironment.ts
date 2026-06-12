import { Bullet } from './bullet.js';
import { ClientCollisionEnvironment } from './clientCollisionEnvironment.js';
import { Obstacles } from './obstacles.js';
import type { RoundState } from '../state/clientScreens.js';
import type { Scenario } from '../../../shared/contracts.js';

type RuntimeCollisionLines = Parameters<typeof Bullet.setCollisionLines>[0];
type RuntimeObstacleBodies = Parameters<typeof Obstacles.setBodies>[0];

type RuntimeCollisionEnvironmentOptions = {
    roundState: RoundState;
    scenario: Scenario | null | undefined;
    scenarioRenderer: {
        getObstacleBodies: (
            scenario: Scenario | null | undefined
        ) => RuntimeObstacleBodies;
        getRockLines: (
            scenario: Scenario | null | undefined
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
