GF.Controllable = function (xpos, ypos, options) {
    options = options || {};
    var config = GF.Config.player;

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
    this.pen = new GF.Pen(
        this.x,
        this.y,
        new GF.Color(
            GF.Config.colors.yellowRgb[0],
            GF.Config.colors.yellowRgb[1],
            GF.Config.colors.yellowRgb[2]
        )
    );
};

GF.Controllable.prototype = {
    move: function (lastupdated, t) {
        var seconds = (t - lastupdated) / 1000;
        var dist = this.speed * seconds;
        var dx = 0;
        var dy = 0;
        var isMoving = false;

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
    },

    moveWithCollision: function (dx, dy) {
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
    },

    canMoveTo: function (x, y) {
        var position = this.clampPosition(x, y);

        return !GF.Obstacles.collidesWithAny(
            this.getCollisionCircles(position.x, position.y)
        );
    },

    applyPosition: function (x, y) {
        var position = this.clampPosition(x, y);

        this.x = position.x;
        this.y = position.y;
    },

    clampPosition: function (x, y) {
        var bounds = this.getBounds();

        return {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
        };
    },

    getBounds: function () {
        var sprite = GF.Config.player.sprite;
        var visibleBounds = sprite.visibleBounds;
        var scale = GF.Config.graphics.scale;
        var left = (-sprite.sourceWidth / 2 + visibleBounds.left) * scale;
        var right = (-sprite.sourceWidth / 2 + visibleBounds.right) * scale;
        var top = (-sprite.sourceHeight + visibleBounds.top) * scale;
        var bottom = (-sprite.sourceHeight + visibleBounds.bottom) * scale;
        var visualLeft = this.facing < 0 ? -right : left;
        var visualRight = this.facing < 0 ? -left : right;

        return {
            minX: -visualLeft,
            maxX: GF.Config.canvas.width - visualRight,
            minY: -top,
            maxY: GF.Config.canvas.height - bottom
        };
    },

    respondToKeyEvent: function (keyEvent) {
        var aim = this.getAim();

        if (keyEvent.action === 'down' && keyEvent.key === 'a') {
            this.aim = Math.min(GF.Config.player.aimLevels.length - 1, aim + 1);
            return;
        }

        if (keyEvent.action === 'down' && keyEvent.key === 'z') {
            this.aim = Math.max(0, aim - 1);
            return;
        }

        this.keys[keyEvent.key] = keyEvent.action === 'down';
    },

    clearKeys: function () {
        this.keys = {};
    },

    resetTo: function (slot) {
        this.x = slot.x;
        this.y = slot.y;
        this.facing = slot.facing;
        this.idleFrame = slot.frame;
        this.frame = this.idleFrame;
        this.aim = GF.Config.player.defaultAim;
        this.animationTime = 0;
        this.deathAnimationTime = null;
        this.clearKeys();
    },

    playDeathAnimation: function () {
        this.deathAnimationTime = 0;
        this.frame = GF.Config.player.deathAnimation.frames[0];
        this.clearKeys();
    },

    clearDeathAnimation: function () {
        this.deathAnimationTime = null;
    },

    isDeathAnimating: function () {
        return typeof this.deathAnimationTime === 'number';
    },

    advanceDeathAnimation: function (seconds) {
        var animation = GF.Config.player.deathAnimation;
        var frameIndex;

        this.deathAnimationTime += seconds;
        frameIndex = Math.min(
            animation.frames.length - 1,
            Math.floor(this.deathAnimationTime / animation.frameTime)
        );
        this.frame = animation.frames[frameIndex];
    },

    getHitBox: function () {
        var sprite = GF.Config.player.sprite;
        var hitZone = sprite.hitZone || sprite.visibleBounds;
        var scale = GF.Config.graphics.scale;
        var left = (-sprite.sourceWidth / 2 + hitZone.left) * scale;
        var right = (-sprite.sourceWidth / 2 + hitZone.right) * scale;
        var top = (-sprite.sourceHeight + hitZone.top) * scale;
        var bottom = (-sprite.sourceHeight + hitZone.bottom) * scale;
        var visualLeft = this.facing < 0 ? -right : left;
        var visualRight = this.facing < 0 ? -left : right;

        return {
            x: this.x + visualLeft,
            y: this.y + top,
            width: visualRight - visualLeft,
            height: bottom - top
        };
    },

    getCollisionCircles: function (x, y) {
        var scale = GF.Config.graphics.scale;
        var collider = GF.Config.player.collider;
        var circles = collider.circles.concat(
            collider.aimCircles[this.getAim()] || []
        );
        var facing = this.facing;

        x = typeof x === 'number' ? x : this.x;
        y = typeof y === 'number' ? y : this.y;

        return circles.map(function (circle) {
            return {
                x: x + circle.x * scale * facing,
                y: y + circle.y * scale,
                radius: circle.radius * scale
            };
        });
    },

    getAim: function () {
        if (
            typeof this.aim === 'number' &&
            GF.Config.player.aimLevels[this.aim]
        ) {
            return this.aim;
        }

        return GF.Config.player.defaultAim;
    },

    draw: function (context) {
        var sprite = GF.Controllable.sprite;

        if (sprite && sprite.complete) {
            var spriteConfig = GF.Config.player.sprite;
            var scale = GF.Config.graphics.scale;
            var sourceWidth = spriteConfig.sourceWidth;
            var sourceHeight = spriteConfig.sourceHeight;
            var targetWidth = sourceWidth * scale;
            var targetHeight = sourceHeight * scale;
            var sourceX = this.frame * spriteConfig.frameStride;
            var sourceY = this.getSpriteRow() * sourceHeight;

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
        this.pen.draw(context);
    },

    getSpriteRow: function () {
        if (this.isDeathAnimating()) {
            return GF.Config.player.deathAnimation.row;
        }

        return GF.Config.player.aimLevels[this.getAim()].row;
    }
};

GF.Controllable.sprite = new Image();
GF.Controllable.sprite.src = GF.Config.player.sprite.src;
