
GF.Controllable = function(xpos, ypos, options){
    options = options || {};
    var config = GF.Config.player;

    this.x = xpos || 100;
    this.y = ypos || 100;
    this.playerId = options.playerId;
    this.facing = options.facing || 1;
    this.idleFrame = options.frame || 0;
    this.frame = this.idleFrame;
    this.aim = 'level';
    this.animationTime = 0;
    this.animationFrameTime = config.animationFrameTime;
    this.animationFrames = config.animationFrames;
    this.speed = options.speed || config.speed;
    this.keys = {};
    this.pen = new GF.Pen(this.x, this.y, new GF.Color(
        GF.Config.colors.yellowRgb[0],
        GF.Config.colors.yellowRgb[1],
        GF.Config.colors.yellowRgb[2]
    ));
};

GF.Controllable.prototype = {
    move: function(lastupdated, t){
        var bounds = GF.Config.player.bounds;
        var seconds = (t - lastupdated) / 1000;
        var dist = this.speed * seconds;
        var isMoving = false;

        if(this.keys.j){
           this.y += dist;
           isMoving = true;
        }
        if(this.keys.k){
           this.y -= dist;
           isMoving = true;
        }
        if(this.keys.h){
           this.x -= dist;
           isMoving = true;
        }
        if(this.keys.l){
           this.x += dist;
           isMoving = true;
        }

        this.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.x));
        this.y = Math.max(bounds.minY, Math.min(bounds.maxY, this.y));

        if(isMoving){
            this.animationTime += seconds;
            this.frame = this.animationFrames[
                Math.floor(this.animationTime / this.animationFrameTime) % this.animationFrames.length
            ];
        }
    },

    respondToKeyEvent: function(keyEvent){
        if(keyEvent.action === 'down' && keyEvent.key === 'a'){
            this.aim = 'raised';
            return;
        }

        if(keyEvent.action === 'down' && keyEvent.key === 'z'){
            this.aim = 'level';
            return;
        }

        this.keys[keyEvent.key] = keyEvent.action === 'down';
    },

    clearKeys: function(){
        this.keys = {};
    },

    resetTo: function(slot){
        this.x = slot.x;
        this.y = slot.y;
        this.facing = slot.facing;
        this.idleFrame = slot.frame;
        this.frame = this.idleFrame;
        this.aim = 'level';
        this.animationTime = 0;
        this.clearKeys();
    },

    getHitBox: function(){
        var hitBox = GF.Config.player.hitBox;

        return {
            x: this.x + hitBox.offsetX,
            y: this.y + hitBox.offsetY,
            width: hitBox.width,
            height: hitBox.height
        };
    },
    
    draw: function(context){
        var sprite = GF.Controllable.sprite;

        if(sprite && sprite.complete){
            var spriteConfig = GF.Config.player.sprite;
            var sourceWidth = spriteConfig.sourceWidth;
            var sourceHeight = spriteConfig.sourceHeight;
            var targetWidth = sourceWidth * spriteConfig.scale;
            var targetHeight = sourceHeight * spriteConfig.scale;
            var sourceX = this.frame * spriteConfig.frameStride;
            var sourceY = GF.Config.player.aimRows[this.aim] * sourceHeight;

            context.save();
            context.translate(this.x, this.y);

            if(this.facing < 0){
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
    }
};

GF.Controllable.sprite = new Image();
GF.Controllable.sprite.src = GF.Config.player.sprite.src;
