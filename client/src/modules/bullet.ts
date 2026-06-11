import { Config } from './config.js';

type Owner = {
    aim?: number;
    facing: number;
    playerId: string | number;
    x: number;
    y: number;
};

type BulletOptions = {
    aim?: number;
    facing?: number;
    hasRicocheted?: boolean;
    height?: number;
    speedX?: number;
    speedY?: number;
    width?: number;
    x?: number;
    y?: number;
};

type CollisionLine = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};

type CollisionResult = {
    normal: {
        x: number;
        y: number;
    };
    progress: number;
};

type DrawContext = {
    fillRect: (x: number, y: number, width: number, height: number) => void;
    fillStyle: string;
};

export class Bullet {
    static collisionLines: CollisionLine[] = [];
    static onRicochet: ((bullet: Bullet) => void) | null = null;

    aim: number;
    deleteMe: boolean;
    facing: number;
    hasRicocheted: boolean;
    height: number;
    ownerId: string | number;
    speedX: number;
    speedY: number;
    stepAccumulator: number;
    width: number;
    x: number;
    y: number;

    constructor(owner: Owner, options: BulletOptions = {}) {
        const config = Config.bullet;
        let aim = typeof options.aim === 'number' ? options.aim : owner.aim;
        const sprite = Config.player.sprite;
        const scale = Config.graphics.scale;

        if (typeof aim !== 'number' || !Config.player.aimLevels[aim]) {
            aim = Config.player.defaultAim;
        }

        const aimLevel = Config.player.aimLevels[aim];
        const muzzle = aimLevel.muzzle;
        const targetWidth = sprite.sourceWidth * scale;
        const targetHeight = sprite.sourceHeight * scale;
        const muzzleOffsetX = -targetWidth / 2 + muzzle.x * scale;
        const muzzleOffsetY = -targetHeight + muzzle.y * scale;
        const angle = (aimLevel.angleDegrees * Math.PI) / 180;
        const hasSnapshot =
            typeof options.x === 'number' && typeof options.y === 'number';

        this.ownerId = owner.playerId;
        this.facing = options.facing || owner.facing;
        this.aim = aim;
        this.x = hasSnapshot
            ? (options.x as number)
            : owner.x + this.facing * muzzleOffsetX;
        this.y = hasSnapshot ? (options.y as number) : owner.y + muzzleOffsetY;
        this.width = options.width || config.width;
        this.height = options.height || config.height;
        this.speedX =
            typeof options.speedX === 'number'
                ? options.speedX
                : this.facing * Math.cos(angle) * config.speed;
        this.speedY =
            typeof options.speedY === 'number'
                ? options.speedY
                : Math.sin(angle) * config.speed;
        this.stepAccumulator = 0;
        this.hasRicocheted = options.hasRicocheted || false;
        this.deleteMe = false;
    }

    move(lastupdated: number, t: number) {
        const seconds = (t - lastupdated) / 1000;
        const fixedStep = Config.bullet.fixedStep;
        const maxAccumulatedSeconds = fixedStep * 8;

        this.stepAccumulator = Math.min(
            this.stepAccumulator + seconds,
            maxAccumulatedSeconds
        );

        while (this.stepAccumulator >= fixedStep && !this.deleteMe) {
            this.moveStep(fixedStep);
            this.stepAccumulator -= fixedStep;
        }
    }

    moveStep(seconds: number) {
        let remaining = seconds;
        let bounces = 0;
        const maxBounces = 3;
        const epsilon = 0.01;

        while (remaining > 0 && bounces <= maxBounces) {
            const collision = Bullet.findCollision(
                this.x,
                this.y,
                this.x + this.speedX * remaining,
                this.y + this.speedY * remaining
            );

            if (!collision) {
                this.x += this.speedX * remaining;
                this.y += this.speedY * remaining;
                break;
            }

            const moveSeconds = remaining * collision.progress;
            this.x += this.speedX * moveSeconds;
            this.y += this.speedY * moveSeconds;
            this.reflect(collision.normal);
            remaining = Math.max(0, remaining - moveSeconds);
            this.x += collision.normal.x * epsilon;
            this.y += collision.normal.y * epsilon;
            bounces += 1;
        }

        if (this.x < -this.width || this.x > Config.canvas.width + this.width) {
            this.deleteMe = true;
        }
    }

    reflect(normal: CollisionResult['normal']) {
        const dot = this.speedX * normal.x + this.speedY * normal.y;

        this.speedX -= 2 * dot * normal.x;
        this.speedY -= 2 * dot * normal.y;
        this.hasRicocheted = true;

        if (Bullet.onRicochet) {
            Bullet.onRicochet(this);
        }
    }

    toSnapshot() {
        return {
            x: this.x,
            y: this.y,
            facing: this.facing,
            aim: this.aim,
            width: this.width,
            height: this.height,
            speedX: this.speedX,
            speedY: this.speedY,
            hasRicocheted: this.hasRicocheted
        };
    }

    getHitBox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    draw(context: DrawContext) {
        context.fillStyle = Config.colors.yellow;
        context.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
    }

    static setCollisionLines(lines: CollisionLine[] = []) {
        Bullet.collisionLines = lines;
    }

    static findCollision(
        fromX: number,
        fromY: number,
        toX: number,
        toY: number
    ): CollisionResult | null {
        const lines = Bullet.getCollisionLines();
        let best: CollisionResult | null = null;

        lines.forEach(function (line) {
            const collision = Bullet.getSegmentIntersection(
                fromX,
                fromY,
                toX,
                toY,
                line.x1,
                line.y1,
                line.x2,
                line.y2
            );

            if (
                !collision ||
                collision.progress <= 0 ||
                collision.progress > 1
            ) {
                return;
            }

            const nextCollision: CollisionResult = {
                progress: collision.progress,
                normal: Bullet.getReflectionNormal(
                    line,
                    toX - fromX,
                    toY - fromY
                )
            };

            if (!best || nextCollision.progress < best.progress) {
                best = nextCollision;
            }
        });

        return best;
    }

    static getCollisionLines() {
        return [
            { x1: 0, y1: 0, x2: Config.canvas.width, y2: 0 },
            {
                x1: 0,
                y1: Config.canvas.height,
                x2: Config.canvas.width,
                y2: Config.canvas.height
            }
        ].concat(Bullet.collisionLines);
    }

    static getSegmentIntersection(
        aX: number,
        aY: number,
        bX: number,
        bY: number,
        cX: number,
        cY: number,
        dX: number,
        dY: number
    ) {
        const bulletX = bX - aX;
        const bulletY = bY - aY;
        const lineX = dX - cX;
        const lineY = dY - cY;
        const denominator = bulletX * lineY - bulletY * lineX;

        if (Math.abs(denominator) < 0.000001) {
            return null;
        }

        const cToAX = cX - aX;
        const cToAY = cY - aY;
        const progress = (cToAX * lineY - cToAY * lineX) / denominator;
        const lineProgress = (cToAX * bulletY - cToAY * bulletX) / denominator;

        if (
            progress < 0 ||
            progress > 1 ||
            lineProgress < 0 ||
            lineProgress > 1
        ) {
            return null;
        }

        return {
            progress
        };
    }

    static getReflectionNormal(
        line: CollisionLine,
        velocityX: number,
        velocityY: number
    ) {
        const lineX = line.x2 - line.x1;
        const lineY = line.y2 - line.y1;
        const length = Math.sqrt(lineX * lineX + lineY * lineY);
        const normal = {
            x: -lineY / length,
            y: lineX / length
        };
        const dot = velocityX * normal.x + velocityY * normal.y;

        if (dot > 0) {
            normal.x = -normal.x;
            normal.y = -normal.y;
        }

        return normal;
    }
}
