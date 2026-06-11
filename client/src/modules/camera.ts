type CameraOptions = {
    scale?: number;
    screenHeight: number;
    screenWidth: number;
    smoothing?: number;
    worldHeight: number;
    worldWidth: number;
};

type CameraTarget = {
    x: number;
    y: number;
};

type CanvasContextLike = {
    scale: (x: number, y: number) => void;
    translate: (x: number, y: number) => void;
};

export class Camera {
    initialized: boolean;
    scale: number;
    screenHeight: number;
    screenWidth: number;
    smoothing: number;
    visibleHeight: number;
    visibleWidth: number;
    visibleX: number;
    visibleY: number;
    worldHeight: number;
    worldWidth: number;
    x: number;
    y: number;

    constructor(options: CameraOptions) {
        this.worldWidth = options.worldWidth;
        this.worldHeight = options.worldHeight;
        this.screenWidth = options.screenWidth;
        this.screenHeight = options.screenHeight;
        this.visibleX = 0;
        this.visibleY = 0;
        this.visibleWidth = options.screenWidth;
        this.visibleHeight = options.screenHeight;
        this.scale = options.scale || 1;
        this.smoothing =
            typeof options.smoothing === 'number' ? options.smoothing : 0.18;
        this.x = 0;
        this.y = 0;
        this.initialized = false;
    }

    setScreenSize(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.setVisibleScreen(0, 0, width, height);
    }

    setVisibleScreen(x: number, y: number, width: number, height: number) {
        this.visibleX = x || 0;
        this.visibleY = y || 0;
        this.visibleWidth = width || this.screenWidth;
        this.visibleHeight = height || this.screenHeight;
    }

    setScale(scale: number) {
        this.scale = Math.max(1, scale || 1);
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.initialized = false;
    }

    follow(target: CameraTarget | null | undefined) {
        if (!target) {
            this.reset();
            return;
        }

        const desired = this.getDesiredPosition(target);

        if (!this.initialized) {
            this.x = desired.x;
            this.y = desired.y;
            this.initialized = true;
            return;
        }

        this.x += (desired.x - this.x) * this.smoothing;
        this.y += (desired.y - this.y) * this.smoothing;
    }

    getDesiredPosition(target: CameraTarget | null | undefined) {
        const viewportWidth = this.visibleWidth / this.scale;
        const viewportHeight = this.visibleHeight / this.scale;
        const visibleWorldX = this.visibleX / this.scale;
        const visibleWorldY = this.visibleY / this.scale;
        const minX = -visibleWorldX;
        const minY = -visibleWorldY;
        const maxX = this.worldWidth - visibleWorldX - viewportWidth;
        const maxY = this.worldHeight - visibleWorldY - viewportHeight;

        if (!target) {
            return {
                x: 0,
                y: 0
            };
        }

        const x = target.x - visibleWorldX - viewportWidth / 2;
        const y = target.y - visibleWorldY - viewportHeight / 2;

        return {
            x: this.clamp(x, Math.min(0, minX), Math.max(0, maxX)),
            y: this.clamp(y, Math.min(0, minY), Math.max(0, maxY))
        };
    }

    apply(context: CanvasContextLike) {
        context.scale(this.scale, this.scale);
        context.translate(-this.x, -this.y);
    }

    clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value));
    }
}
