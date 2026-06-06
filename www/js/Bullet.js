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

    this.ownerId = owner.playerId;
    this.facing = owner.facing;
    this.aim = owner.aim;
    this.x = owner.x + (this.facing * muzzleOffsetX);
    this.y = owner.y + muzzleOffsetY;
    this.width = options.width || config.width;
    this.height = options.height || config.height;
    this.speedX = options.speedX || (this.aim === 'raised' ? diagonalSpeed : config.speed);
    this.speedY = options.speedY || (this.aim === 'raised' ? -diagonalSpeed : 0);
    this.deleteMe = false;
};

GF.Bullet.prototype = {
    move: function(lastupdated, t){
        var seconds = (t - lastupdated) / 1000;

        this.x += this.facing * this.speedX * seconds;
        this.y += this.speedY * seconds;

        if(this.x < -this.width ||
            this.x > GF.Config.canvas.width + this.width ||
            this.y < -this.height ||
            this.y > GF.Config.canvas.height + this.height){
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
