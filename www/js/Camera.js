GF.Camera = function(options){
    options = options || {};

    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;
    this.screenWidth = options.screenWidth;
    this.screenHeight = options.screenHeight;
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
        var viewportWidth = this.screenWidth / this.scale;
        var viewportHeight = this.screenHeight / this.scale;
        var x;
        var y;

        if(!target){
            return {
                x: 0,
                y: 0
            };
        }

        x = target.x - (viewportWidth / 2);
        y = target.y - (viewportHeight / 2);

        return {
            x: this.clamp(x, 0, Math.max(0, this.worldWidth - viewportWidth)),
            y: this.clamp(y, 0, Math.max(0, this.worldHeight - viewportHeight))
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
