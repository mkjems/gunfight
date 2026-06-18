import { DuelState } from '../state/clientScreens.js';

type UpdateOptions = {
    checkForHits: () => void;
    updateParticles: () => void;
    duelIntro: {
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
    scale: (x: number, y: number) => void;
    translate: (x: number, y: number) => void;
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
    drawParticles: (context: RenderContext) => void;
    drawScenario: () => void;
    particleCanvas: {
        height: number;
        width: number;
    };
    particleContext: RenderContext;
    renderHud: () => void;
    duelState: DuelState;
    scene: {
        drawAll: (context: RenderContext) => void;
    };
    shouldUseCamera: () => boolean;
    updateTouchControls: () => void;
};

export function update(options: UpdateOptions) {
    options.updateBulletCollisionEnvironment();
    options.updateMovementObstacleEnvironment();
    options.updateParticles();
    options.scene.moveAll();
    options.duelIntro.update();
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
    options.particleContext.clearRect(
        0,
        0,
        options.particleCanvas.width,
        options.particleCanvas.height
    );
    options.context.save();

    if (options.shouldUseCamera()) {
        options.camera.apply(options.context);
    }

    if (options.duelState !== DuelState.WAITING) {
        options.drawScenario();
    }

    options.scene.drawAll(options.context);
    options.drawCollisionBodies();
    options.context.restore();

    options.particleContext.save();

    if (options.shouldUseCamera()) {
        options.camera.apply(options.particleContext);
    }

    options.drawParticles(options.particleContext);
    options.particleContext.restore();

    options.renderHud();
    options.updateTouchControls();
}

export const ClientFrameFlow = {
    render,
    update
};
