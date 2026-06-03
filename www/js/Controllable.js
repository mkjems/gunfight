
GF.Controllable = function(xpos, ypos, options){
    options = options || {};

    this.x = xpos || 100;
    this.y = ypos || 100;
    this.playerId = options.playerId;
    this.facing = options.facing || 1;
    this.idleFrame = options.frame || 0;
    this.frame = this.idleFrame;
    this.animationTime = 0;
    this.animationFrameTime = 0.14;
    this.animationFrames = [0, 1, 2, 3];
    this.speed = options.speed || 120; // pixels per second.
    this.keys = {};
    this.pen = new GF.Pen(this.x, this.y, new GF.Color(255,255,0));
};

GF.Controllable.prototype = {
    move: function(lastupdated, t){
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

        this.x = Math.max(55, Math.min(895, this.x));
        this.y = Math.max(130, Math.min(630, this.y));

        if(isMoving){
            this.animationTime += seconds;
            this.frame = this.animationFrames[
                Math.floor(this.animationTime / this.animationFrameTime) % this.animationFrames.length
            ];
        } else {
            this.animationTime = 0;
            this.frame = this.idleFrame;
        }
    },

    respondToKeyEvent: function(keyEvent){
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
        this.animationTime = 0;
        this.clearKeys();
    },

    getHitBox: function(){
        return {
            x: this.x - 30,
            y: this.y - 112,
            width: 60,
            height: 104
        };
    },
    
    draw: function(context){
        var sprite = GF.Controllable.sprite;

        if(sprite && sprite.complete){
            var sourceWidth = 55;
            var sourceHeight = 65;
            var targetWidth = sourceWidth * 2;
            var targetHeight = sourceHeight * 2;
            var sourceX = this.frame * 56;

            context.save();
            context.translate(this.x, this.y);

            if(this.facing < 0){
                context.scale(-1, 1);
            }

            context.drawImage(
                sprite,
                sourceX,
                0,
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
GF.Controllable.sprite.src = 'images/gunfight_sprite.png';
