import { RoundState } from './clientScreens.js';

type UpdateOptions = {
    checkForHits: () => void;
    roundIntro: {
        update: () => void;
    };
    scene: {
        moveAll: () => void;
    };
    syncLocalPlayerPosition: () => void;
    updateBulletCollisionEnvironment: () => void;
    updateCamera: () => void;
    updateMovementObstacleEnvironment: () => void;
};

type RenderContext = {
    clearRect: (x: number, y: number, width: number, height: number) => void;
    restore: () => void;
    save: () => void;
};

type RenderOptions = {
    camera: {
        apply: (context: RenderContext) => void;
    };
    canvas: {
        height: number;
        width: number;
    };
    context: RenderContext;
    drawCollisionBodies: () => void;
    drawScenario: () => void;
    renderHud: () => void;
    roundState: RoundState;
    scene: {
        drawAll: (context: RenderContext) => void;
    };
    shouldUseCamera: () => boolean;
    updateTouchControls: () => void;
};

export function update(options: UpdateOptions) {
    options.updateBulletCollisionEnvironment();
    options.updateMovementObstacleEnvironment();
    options.scene.moveAll();
    options.roundIntro.update();
    options.syncLocalPlayerPosition();
    options.checkForHits();
    options.updateCamera();
}

export function render(options: RenderOptions) {
    options.context.clearRect(
        0,
        0,
        options.canvas.width,
        options.canvas.height
    );
    options.context.save();

    if (options.shouldUseCamera()) {
        options.camera.apply(options.context);
    }

    if (options.roundState !== RoundState.WAITING) {
        options.drawScenario();
    }

    options.scene.drawAll(options.context);
    options.drawCollisionBodies();
    options.context.restore();
    options.renderHud();
    options.updateTouchControls();
}

export const ClientFrameFlow = {
    render,
    update
};
