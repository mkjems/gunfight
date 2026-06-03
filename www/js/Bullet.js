GF.Bullet = function(owner, options){
    options = options || {};
    var config = GF.Config.bullet;

    this.ownerId = owner.playerId;
    this.facing = owner.facing;
    this.x = owner.x + (this.facing * config.muzzleOffsetX);
    this.y = owner.y + config.muzzleOffsetY;
    this.width = options.width || config.width;
    this.height = options.height || config.height;
    this.speed = options.speed || config.speed;
    this.deleteMe = false;
};

GF.Bullet.prototype = {
    move: function(lastupdated, t){
        var seconds = (t - lastupdated) / 1000;

        this.x += this.facing * this.speed * seconds;

        if(this.x < -this.width || this.x > GF.Config.canvas.width + this.width){
            this.deleteMe = true;
        }
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
