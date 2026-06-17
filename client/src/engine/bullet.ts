import { Config } from '../platform/config.js';

type Owner = {
    aim?: number;
    facing: number;
    playerId: string | number;
    shootingStraightness?: number;
    x: number;
    y: number;
};

type BulletOptions = {
    aim?: number;
    altitude?: number;
    altitudeVelocity?: number;
    facing?: number;
    hasRicocheted?: boolean;
    height?: number;
    isHarmful?: boolean;
    isResting?: boolean;
    speedX?: number;
    speedY?: number;
    straightness?: number;
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
    altitude: number;
    altitudeVelocity: number;
    deleteMe: boolean;
    facing: number;
    hasRicocheted: boolean;
    height: number;
    isHarmful: boolean;
    hasStartedMoving: boolean;
    isResting: boolean;
    ownerId: string | number;
    speedX: number;
    speedY: number;
    stepAccumulator: number;
    straightness: number;
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
        this.straightness = Bullet.normalizeStraightness(
            typeof options.straightness === 'number'
                ? options.straightness
                : owner.shootingStraightness
        );
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
        this.altitude =
            typeof options.altitude === 'number'
                ? Math.max(0, options.altitude)
                : this.getStartingAltitude();
        this.altitudeVelocity =
            typeof options.altitudeVelocity === 'number'
                ? options.altitudeVelocity
                : this.getStartingAltitudeVelocity();
        this.stepAccumulator = 0;
        this.hasRicocheted = options.hasRicocheted || false;
        this.hasStartedMoving = false;
        this.isResting = options.isResting === true;
        this.isHarmful =
            typeof options.isHarmful === 'boolean' ? options.isHarmful : true;
        this.deleteMe = false;
        this.updateRestingSnapshotState();
        this.updateHarmState();
    }

    move(lastupdated: number, t: number) {
        if (this.isResting) {
            return;
        }

        if (!this.hasStartedMoving) {
            this.hasStartedMoving = true;
            return;
        }

        const seconds = (t - lastupdated) / 1000;
        const fixedStep = Config.bullet.fixedStep;
        const maxAccumulatedSeconds = fixedStep * 8;

        this.stepAccumulator = Math.min(
            this.stepAccumulator + seconds,
            maxAccumulatedSeconds
        );

        while (
            this.stepAccumulator >= fixedStep &&
            !this.deleteMe &&
            !this.isResting
        ) {
            this.moveStep(fixedStep);
            this.stepAccumulator -= fixedStep;
        }
    }

    moveStep(seconds: number) {
        if (this.isResting) {
            return;
        }

        this.moveGround(seconds);
        this.moveAltitude(seconds);
        this.applyGroundDrag(seconds);
        this.updateRestingState();
        this.updateHarmState();
    }

    moveGround(seconds: number) {
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

    moveAltitude(seconds: number) {
        if (this.isStraightFlight()) {
            return;
        }

        this.altitude += this.altitudeVelocity * seconds;
        this.altitudeVelocity -= Config.bullet.altitudeGravity * seconds;

        if (this.altitude > 0) {
            return;
        }

        this.altitude = 0;

        if (this.altitudeVelocity >= 0) {
            return;
        }

        const nextVelocity =
            -this.altitudeVelocity * this.getAltitudeBounceRetention();

        this.altitudeVelocity =
            nextVelocity >= Config.bullet.altitudeMinBounceVelocity
                ? nextVelocity
                : 0;
    }

    applyGroundDrag(seconds: number) {
        if (this.isStraightFlight()) {
            return;
        }

        const drag = (1 - this.straightness) * Config.bullet.groundDrag;
        const speedScale = Math.max(0, 1 - drag * seconds);

        this.speedX *= speedScale;
        this.speedY *= speedScale;
    }

    updateRestingState() {
        if (
            this.isStraightFlight() ||
            this.altitude > 0 ||
            Math.abs(this.altitudeVelocity) > 0 ||
            this.getGroundSpeed() > Config.bullet.restVelocity
        ) {
            return;
        }

        this.isResting = true;
        this.updateRestingSnapshotState();
    }

    updateRestingSnapshotState() {
        if (!this.isResting) {
            return;
        }

        this.altitude = 0;
        this.altitudeVelocity = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.isHarmful = false;
    }

    updateHarmState() {
        this.isHarmful =
            !this.deleteMe &&
            !this.isResting &&
            this.straightness >= Config.bullet.minimumHarmStraightness &&
            this.getGroundSpeed() >= Config.bullet.harmVelocity;
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
            straightness: this.straightness,
            altitude: this.altitude,
            altitudeVelocity: this.altitudeVelocity,
            speedX: this.speedX,
            speedY: this.speedY,
            hasRicocheted: this.hasRicocheted,
            isResting: this.isResting,
            isHarmful: this.isHarmful
        };
    }

    getHitBox() {
        const visualY = this.y - this.altitude;

        return {
            x: this.x - this.width / 2,
            y: visualY - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    canHarm() {
        return this.isHarmful;
    }

    draw(context: DrawContext) {
        if (this.altitude > 0 || this.isResting) {
            context.fillStyle = 'rgba(0, 0, 0, 0.35)';
            context.fillRect(
                this.x - this.width / 2,
                this.y + this.height / 2,
                this.width,
                1
            );
        }

        context.fillStyle = Config.colors.yellow;
        context.fillRect(
            this.x - this.width / 2,
            this.y - this.altitude - this.height / 2,
            this.width,
            this.height
        );
    }

    getStartingAltitude() {
        if (this.isStraightFlight()) {
            return 0;
        }

        return (1 - this.straightness) * Config.bullet.altitudeMaxStart;
    }

    getStartingAltitudeVelocity() {
        if (this.isStraightFlight()) {
            return 0;
        }

        return (1 - this.straightness) * Config.bullet.altitudeBounceVelocity;
    }

    getAltitudeBounceRetention() {
        return 0.3 + (1 - this.straightness) * 0.35;
    }

    getGroundSpeed() {
        return Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
    }

    isStraightFlight() {
        return this.straightness >= 1;
    }

    static setCollisionLines(lines: CollisionLine[] = []) {
        Bullet.collisionLines = lines;
    }

    static normalizeStraightness(straightness?: number) {
        const raw =
            typeof straightness === 'number'
                ? straightness
                : Config.bullet.defaultStraightness;

        if (!Number.isFinite(raw)) {
            return Config.bullet.defaultStraightness;
        }

        return Math.max(0, Math.min(1, raw));
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
