GF.Bullet = function(owner, options){
    options = options || {};

    this.ownerId = owner.playerId;
    this.facing = owner.facing;
    this.x = owner.x + (this.facing * 54);
    this.y = owner.y - 82;
    this.width = options.width || 18;
    this.height = options.height || 4;
    this.speed = options.speed || 420;
    this.deleteMe = false;
};

GF.Bullet.prototype = {
    move: function(lastupdated, t){
        var seconds = (t - lastupdated) / 1000;

        this.x += this.facing * this.speed * seconds;

        if(this.x < -this.width || this.x > 800 + this.width){
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
        context.fillStyle = 'rgb(255,244,0)';
        context.fillRect(
            this.x - (this.width / 2),
            this.y - (this.height / 2),
            this.width,
            this.height
        );
    }
};
