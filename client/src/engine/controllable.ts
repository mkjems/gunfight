import { Color } from '../platform/color.js';
import { Config } from '../platform/config.js';
import { Obstacles } from './obstacles.js';
import { Pen } from '../platform/pen.js';

type ControllableOptions = {
    facing?: number;
    frame?: number;
    playerId?: string | number;
    speed?: number;
};

type KeyEventPayload = {
    action: string;
    key: string;
};

type PlayerSlot = {
    facing: number;
    frame: number;
    x: number;
    y: number;
};

type DrawContext = {
    drawImage: (...args: unknown[]) => void;
    restore: () => void;
    save: () => void;
    scale: (x: number, y: number) => void;
    translate: (x: number, y: number) => void;
};

type ImageLike = {
    complete?: boolean;
    src?: string;
};

export class Controllable {
    static sprite: ImageLike | null = createSprite();

    aim: number;
    animationFrameTime: number;
    animationFrames: number[];
    animationTime: number;
    deathAnimationTime: number | null;
    deleteMe?: boolean;
    facing: number;
    frame: number;
    idleFrame: number;
    keys: Record<string, boolean>;
    pen: Pen;
    playerId?: string | number;
    slot?: number;
    speed: number;
    x: number;
    y: number;

    constructor(
        xpos?: number,
        ypos?: number,
        options: ControllableOptions = {}
    ) {
        const config = Config.player;

        this.x = xpos || 100;
        this.y = ypos || 100;
        this.playerId = options.playerId;
        this.facing = options.facing || 1;
        this.idleFrame = options.frame || 0;
        this.frame = this.idleFrame;
        this.aim = config.defaultAim;
        this.animationTime = 0;
        this.animationFrameTime = config.animationFrameTime;
        this.animationFrames = config.animationFrames;
        this.deathAnimationTime = null;
        this.speed = options.speed || config.speed;
        this.keys = {};
        this.pen = new Pen(
            this.x,
            this.y,
            new Color(
                Config.colors.yellowRgb[0],
                Config.colors.yellowRgb[1],
                Config.colors.yellowRgb[2]
            )
        );
    }

    move(lastupdated: number, t: number) {
        const seconds = (t - lastupdated) / 1000;
        const dist = this.speed * seconds;
        let dx = 0;
        let dy = 0;
        let isMoving = false;

        if (this.isDeathAnimating()) {
            this.advanceDeathAnimation(seconds);
            return;
        }

        if (this.keys.j) {
            dy += dist;
            isMoving = true;
        }
        if (this.keys.k) {
            dy -= dist;
            isMoving = true;
        }
        if (this.keys.h) {
            dx -= dist;
            isMoving = true;
        }
        if (this.keys.l) {
            dx += dist;
            isMoving = true;
        }

        if (isMoving) {
            this.moveWithCollision(dx, dy);
        }

        if (isMoving) {
            this.animationTime += seconds;
            this.frame =
                this.animationFrames[
                    Math.floor(this.animationTime / this.animationFrameTime) %
                        this.animationFrames.length
                ];
        }
    }

    moveWithCollision(dx: number, dy: number) {
        if (this.canMoveTo(this.x + dx, this.y + dy)) {
            this.applyPosition(this.x + dx, this.y + dy);
            return;
        }

        if (dx && this.canMoveTo(this.x + dx, this.y)) {
            this.applyPosition(this.x + dx, this.y);
        }

        if (dy && this.canMoveTo(this.x, this.y + dy)) {
            this.applyPosition(this.x, this.y + dy);
        }
    }

    canMoveTo(x: number, y: number) {
        const position = this.clampPosition(x, y);

        return !Obstacles.collidesWithAny(
            this.getCollisionCircles(position.x, position.y)
        );
    }

    applyPosition(x: number, y: number) {
        const position = this.clampPosition(x, y);

        this.x = position.x;
        this.y = position.y;
    }

    clampPosition(x: number, y: number) {
        const bounds = this.getBounds();

        return {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
        };
    }

    getBounds() {
        const sprite = Config.player.sprite;
        const visibleBounds = sprite.visibleBounds;
        const scale = Config.graphics.scale;
        const left = (-sprite.sourceWidth / 2 + visibleBounds.left) * scale;
        const right = (-sprite.sourceWidth / 2 + visibleBounds.right) * scale;
        const top = (-sprite.sourceHeight + visibleBounds.top) * scale;
        const bottom = (-sprite.sourceHeight + visibleBounds.bottom) * scale;
        const visualLeft = this.facing < 0 ? -right : left;
        const visualRight = this.facing < 0 ? -left : right;

        return {
            minX: -visualLeft,
            maxX: Config.canvas.width - visualRight,
            minY: -top,
            maxY: Config.canvas.height - bottom
        };
    }

    respondToKeyEvent(keyEvent: KeyEventPayload) {
        const aim = this.getAim();

        if (keyEvent.action === 'down' && keyEvent.key === 'a') {
            this.aim = Math.min(Config.player.aimLevels.length - 1, aim + 1);
            return;
        }

        if (keyEvent.action === 'down' && keyEvent.key === 'z') {
            this.aim = Math.max(0, aim - 1);
            return;
        }

        this.keys[keyEvent.key] = keyEvent.action === 'down';
    }

    clearKeys() {
        this.keys = {};
    }

    resetTo(slot: PlayerSlot) {
        this.x = slot.x;
        this.y = slot.y;
        this.facing = slot.facing;
        this.idleFrame = slot.frame;
        this.frame = this.idleFrame;
        this.aim = Config.player.defaultAim;
        this.animationTime = 0;
        this.deathAnimationTime = null;
        this.clearKeys();
    }

    playDeathAnimation() {
        this.deathAnimationTime = 0;
        this.frame = Config.player.deathAnimation.frames[0];
        this.clearKeys();
    }

    clearDeathAnimation() {
        this.deathAnimationTime = null;
    }

    isDeathAnimating() {
        return typeof this.deathAnimationTime === 'number';
    }

    advanceDeathAnimation(seconds: number) {
        const animation = Config.player.deathAnimation;

        this.deathAnimationTime = (this.deathAnimationTime || 0) + seconds;
        const frameIndex = Math.min(
            animation.frames.length - 1,
            Math.floor(this.deathAnimationTime / animation.frameTime)
        );
        this.frame = animation.frames[frameIndex];
    }

    getHitBox() {
        const sprite = Config.player.sprite;
        const hitZone = sprite.hitZone || sprite.visibleBounds;
        const scale = Config.graphics.scale;
        const left = (-sprite.sourceWidth / 2 + hitZone.left) * scale;
        const right = (-sprite.sourceWidth / 2 + hitZone.right) * scale;
        const top = (-sprite.sourceHeight + hitZone.top) * scale;
        const bottom = (-sprite.sourceHeight + hitZone.bottom) * scale;
        const visualLeft = this.facing < 0 ? -right : left;
        const visualRight = this.facing < 0 ? -left : right;

        return {
            x: this.x + visualLeft,
            y: this.y + top,
            width: visualRight - visualLeft,
            height: bottom - top
        };
    }

    getCollisionCircles(x?: number, y?: number) {
        const scale = Config.graphics.scale;
        const collider = Config.player.collider;
        const circles = collider.circles.concat(
            collider.aimCircles[this.getAim()] || []
        );
        const facing = this.facing;
        const nextX = typeof x === 'number' ? x : this.x;
        const nextY = typeof y === 'number' ? y : this.y;

        return circles.map(function (circle) {
            return {
                x: nextX + circle.x * scale * facing,
                y: nextY + circle.y * scale,
                radius: circle.radius * scale
            };
        });
    }

    getAim() {
        if (typeof this.aim === 'number' && Config.player.aimLevels[this.aim]) {
            return this.aim;
        }

        return Config.player.defaultAim;
    }

    draw(context: DrawContext) {
        const sprite = Controllable.sprite;

        if (sprite && sprite.complete) {
            const spriteConfig = Config.player.sprite;
            const scale = Config.graphics.scale;
            const sourceWidth = spriteConfig.sourceWidth;
            const sourceHeight = spriteConfig.sourceHeight;
            const targetWidth = sourceWidth * scale;
            const targetHeight = sourceHeight * scale;
            const sourceX = this.frame * spriteConfig.frameStride;
            const sourceY = this.getSpriteRow() * sourceHeight;

            context.save();
            context.translate(this.x, this.y);

            if (this.facing < 0) {
                context.scale(-1, 1);
            }

            context.drawImage(
                sprite,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                -targetWidth / 2,
                -targetHeight,
                targetWidth,
                targetHeight
            );
            context.restore();
            return;
        }

        this.pen.x = this.x;
        this.pen.y = this.y;
        this.pen.draw(context as never);
    }

    getSpriteRow() {
        if (this.isDeathAnimating()) {
            return Config.player.deathAnimation.row;
        }

        return Config.player.aimLevels[this.getAim()].row;
    }
}

function createSprite() {
    if (typeof Image === 'undefined') {
        return null;
    }

    const sprite = new Image();
    sprite.src = Config.player.sprite.src;
    return sprite;
}
