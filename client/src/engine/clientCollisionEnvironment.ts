import { RoundState } from '../state/clientScreens.js';

type CollisionEnvironmentOptions<TScenario, TLines, TBodies> = {
    Bullet: {
        setCollisionLines: (lines: TLines) => void;
    };
    Obstacles: {
        setBodies: (bodies: TBodies) => void;
    };
    roundState: RoundState;
    scenario: TScenario | null | undefined;
    scenarioRenderer: {
        getObstacleBodies: (scenario: TScenario | null | undefined) => TBodies;
        getRockLines: (scenario: TScenario | null | undefined) => TLines;
    };
};

export function updateBulletLines<TScenario, TLines, TBodies>(
    options: CollisionEnvironmentOptions<TScenario, TLines, TBodies>
) {
    options.Bullet.setCollisionLines(
        options.scenarioRenderer.getRockLines(options.scenario)
    );
}

export function updateObstacleBodies<TScenario, TLines, TBodies>(
    options: CollisionEnvironmentOptions<TScenario, TLines, TBodies>
) {
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
