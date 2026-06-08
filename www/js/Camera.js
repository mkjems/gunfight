GF.Camera = function(options){
    options = options || {};

    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;
    this.screenWidth = options.screenWidth;
    this.screenHeight = options.screenHeight;
    this.visibleX = 0;
    this.visibleY = 0;
    this.visibleWidth = options.screenWidth;
    this.visibleHeight = options.screenHeight;
    this.scale = options.scale || 1;
    this.smoothing = typeof options.smoothing === 'number' ? options.smoothing : 0.18;
    this.x = 0;
    this.y = 0;
    this.initialized = false;
};

GF.Camera.prototype = {
    setScreenSize: function(width, height){
        this.screenWidth = width;
        this.screenHeight = height;
        this.setVisibleScreen(0, 0, width, height);
    },

    setVisibleScreen: function(x, y, width, height){
        this.visibleX = x || 0;
        this.visibleY = y || 0;
        this.visibleWidth = width || this.screenWidth;
        this.visibleHeight = height || this.screenHeight;
    },

    setScale: function(scale){
        this.scale = Math.max(1, scale || 1);
    },

    reset: function(){
        this.x = 0;
        this.y = 0;
        this.initialized = false;
    },

    follow: function(target){
        var desired = this.getDesiredPosition(target);

        if(!target){
            this.reset();
            return;
        }

        if(!this.initialized){
            this.x = desired.x;
            this.y = desired.y;
            this.initialized = true;
            return;
        }

        this.x += (desired.x - this.x) * this.smoothing;
        this.y += (desired.y - this.y) * this.smoothing;
    },

    getDesiredPosition: function(target){
        var viewportWidth = this.visibleWidth / this.scale;
        var viewportHeight = this.visibleHeight / this.scale;
        var visibleWorldX = this.visibleX / this.scale;
        var visibleWorldY = this.visibleY / this.scale;
        var minX = -visibleWorldX;
        var minY = -visibleWorldY;
        var maxX = this.worldWidth - visibleWorldX - viewportWidth;
        var maxY = this.worldHeight - visibleWorldY - viewportHeight;
        var x;
        var y;

        if(!target){
            return {
                x: 0,
                y: 0
            };
        }

        x = target.x - visibleWorldX - (viewportWidth / 2);
        y = target.y - visibleWorldY - (viewportHeight / 2);

        return {
            x: this.clamp(x, Math.min(0, minX), Math.max(0, maxX)),
            y: this.clamp(y, Math.min(0, minY), Math.max(0, maxY))
        };
    },

    apply: function(context){
        context.scale(this.scale, this.scale);
        context.translate(-this.x, -this.y);
    },

    clamp: function(value, min, max){
        return Math.max(min, Math.min(max, value));
    }
};
