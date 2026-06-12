import { Bullet } from './bullet.js';
import { ClientCollisionEnvironment } from './clientCollisionEnvironment.js';
import { Obstacles } from './obstacles.js';

type RuntimeCollisionEnvironmentOptions = {
    roundState: Parameters<
        typeof ClientCollisionEnvironment.updateObstacleBodies
    >[0]['roundState'];
    scenario: unknown;
    scenarioRenderer: Parameters<
        typeof ClientCollisionEnvironment.updateObstacleBodies
    >[0]['scenarioRenderer'];
};

export function updateBulletLines(options: RuntimeCollisionEnvironmentOptions) {
    ClientCollisionEnvironment.updateBulletLines({
        Bullet: Bullet as any,
        Obstacles: Obstacles as any,
        roundState: options.roundState,
        scenario: options.scenario,
        scenarioRenderer: options.scenarioRenderer
    });
}

export function updateObstacleBodies(
    options: RuntimeCollisionEnvironmentOptions
) {
    ClientCollisionEnvironment.updateObstacleBodies({
        Bullet: Bullet as any,
        Obstacles: Obstacles as any,
        roundState: options.roundState,
        scenario: options.scenario,
        scenarioRenderer: options.scenarioRenderer
    });
}

export const ClientRuntimeCollisionEnvironment = {
    updateBulletLines,
    updateObstacleBodies
};
