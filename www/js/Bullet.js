GF.Bullet = function(owner, options){
    options = options || {};
    var config = GF.Config.bullet;
    var sprite = GF.Config.player.sprite;
    var scale = GF.Config.graphics.scale;
    var muzzle = config.muzzle[owner.aim];
    var targetWidth = sprite.sourceWidth * scale;
    var targetHeight = sprite.sourceHeight * scale;
    var muzzleOffsetX = (-targetWidth / 2) + (muzzle.x * scale);
    var muzzleOffsetY = -targetHeight + (muzzle.y * scale);
    var diagonalSpeed = config.speed / Math.sqrt(2);
    var hasSnapshot = typeof options.x === 'number' && typeof options.y === 'number';

    this.ownerId = owner.playerId;
    this.facing = options.facing || owner.facing;
    this.aim = options.aim || owner.aim;
    this.x = hasSnapshot ? options.x : owner.x + (this.facing * muzzleOffsetX);
    this.y = hasSnapshot ? options.y : owner.y + muzzleOffsetY;
    this.width = options.width || config.width;
    this.height = options.height || config.height;
    this.speedX = typeof options.speedX === 'number' ?
        options.speedX :
        this.facing * (this.aim === 'raised' ? diagonalSpeed : config.speed);
    this.speedY = typeof options.speedY === 'number' ?
        options.speedY :
        (this.aim === 'raised' ? -diagonalSpeed : 0);
    this.stepAccumulator = 0;
    this.deleteMe = false;
};

GF.Bullet.prototype = {
    move: function(lastupdated, t){
        var seconds = (t - lastupdated) / 1000;
        var fixedStep = GF.Config.bullet.fixedStep;
        var maxAccumulatedSeconds = fixedStep * 8;

        this.stepAccumulator = Math.min(this.stepAccumulator + seconds, maxAccumulatedSeconds);

        while(this.stepAccumulator >= fixedStep && !this.deleteMe){
            this.moveStep(fixedStep);
            this.stepAccumulator -= fixedStep;
        }
    },

    moveStep: function(seconds){
        var remaining = seconds;
        var bounces = 0;
        var maxBounces = 3;
        var collision;
        var moveSeconds;
        var epsilon = 0.01;

        while(remaining > 0 && bounces <= maxBounces){
            collision = GF.Bullet.findCollision(
                this.x,
                this.y,
                this.x + (this.speedX * remaining),
                this.y + (this.speedY * remaining)
            );

            if(!collision){
                this.x += this.speedX * remaining;
                this.y += this.speedY * remaining;
                break;
            }

            moveSeconds = remaining * collision.progress;
            this.x += this.speedX * moveSeconds;
            this.y += this.speedY * moveSeconds;
            this.reflect(collision.normal);
            remaining = Math.max(0, remaining - moveSeconds);
            this.x += collision.normal.x * epsilon;
            this.y += collision.normal.y * epsilon;
            bounces++;
        }

        if(this.x < -this.width || this.x > GF.Config.canvas.width + this.width){
            this.deleteMe = true;
        }
    },

    reflect: function(normal){
        var dot = (this.speedX * normal.x) + (this.speedY * normal.y);

        this.speedX -= 2 * dot * normal.x;
        this.speedY -= 2 * dot * normal.y;
    },

    toSnapshot: function(){
        return {
            x: this.x,
            y: this.y,
            facing: this.facing,
            aim: this.aim,
            width: this.width,
            height: this.height,
            speedX: this.speedX,
            speedY: this.speedY
        };
    },

    getHitBox: function(){
        return {
            x: this.x - (this.width / 2),
            y: this.y - (this.height / 2),
            width: this.width,
            height: this.height
        };
    },

    draw: function(context){
        context.fillStyle = GF.Config.colors.yellow;
        context.fillRect(
            this.x - (this.width / 2),
            this.y - (this.height / 2),
            this.width,
            this.height
        );
    }
};

GF.Bullet.collisionLines = [];

GF.Bullet.setCollisionLines = function(lines){
    GF.Bullet.collisionLines = lines || [];
};

GF.Bullet.findCollision = function(fromX, fromY, toX, toY){
    var lines = GF.Bullet.getCollisionLines();
    var best = null;

    lines.forEach(function(line){
        var collision = GF.Bullet.getSegmentIntersection(fromX, fromY, toX, toY, line.x1, line.y1, line.x2, line.y2);

        if(!collision || collision.progress <= 0 || collision.progress > 1){
            return;
        }

        collision.normal = GF.Bullet.getReflectionNormal(line, toX - fromX, toY - fromY);

        if(!best || collision.progress < best.progress){
            best = collision;
        }
    });

    return best;
};

GF.Bullet.getCollisionLines = function(){
    return [
        { x1: 0, y1: 0, x2: GF.Config.canvas.width, y2: 0 },
        { x1: 0, y1: GF.Config.canvas.height, x2: GF.Config.canvas.width, y2: GF.Config.canvas.height }
    ].concat(GF.Bullet.collisionLines);
};

GF.Bullet.getSegmentIntersection = function(aX, aY, bX, bY, cX, cY, dX, dY){
    var bulletX = bX - aX;
    var bulletY = bY - aY;
    var lineX = dX - cX;
    var lineY = dY - cY;
    var denominator = (bulletX * lineY) - (bulletY * lineX);
    var cToAX;
    var cToAY;
    var progress;
    var lineProgress;

    if(Math.abs(denominator) < 0.000001){
        return null;
    }

    cToAX = cX - aX;
    cToAY = cY - aY;
    progress = ((cToAX * lineY) - (cToAY * lineX)) / denominator;
    lineProgress = ((cToAX * bulletY) - (cToAY * bulletX)) / denominator;

    if(progress < 0 || progress > 1 || lineProgress < 0 || lineProgress > 1){
        return null;
    }

    return {
        progress: progress
    };
};

GF.Bullet.getReflectionNormal = function(line, velocityX, velocityY){
    var lineX = line.x2 - line.x1;
    var lineY = line.y2 - line.y1;
    var length = Math.sqrt((lineX * lineX) + (lineY * lineY));
    var normal = {
        x: -lineY / length,
        y: lineX / length
    };
    var dot = (velocityX * normal.x) + (velocityY * normal.y);

    if(dot > 0){
        normal.x = -normal.x;
        normal.y = -normal.y;
    }

    return normal;
};
