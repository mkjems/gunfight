import { RoundState } from './clientScreens.js';

type CollisionEnvironmentOptions = {
    Bullet: {
        setCollisionLines: (lines: unknown) => void;
    };
    Obstacles: {
        setBodies: (bodies: unknown) => void;
    };
    roundState: RoundState;
    scenario: unknown;
    scenarioRenderer: {
        getObstacleBodies: (scenario: unknown) => unknown;
        getRockLines: (scenario: unknown) => unknown;
    };
};

export function updateBulletLines(options: CollisionEnvironmentOptions) {
    options.Bullet.setCollisionLines(
        options.scenarioRenderer.getRockLines(options.scenario)
    );
}

export function updateObstacleBodies(options: CollisionEnvironmentOptions) {
    const scenario =
        options.roundState === RoundState.WAITING ? null : options.scenario;

    options.Obstacles.setBodies(
        options.scenarioRenderer.getObstacleBodies(scenario)
    );
}

export const ClientCollisionEnvironment = {
    updateBulletLines,
    updateObstacleBodies
};
