GF.Bullets = function(scene){
    var bullets = {};

    function fire(player, options){
        var activeBullet = bullets[player.playerId];
        var bullet;

        if(activeBullet && !activeBullet.deleteMe){
            return false;
        }

        bullet = new GF.Bullet(player, options);
        bullets[player.playerId] = bullet;
        scene.addFigure(bullet);
        return bullet;
    }

    function remove(id){
        if(!bullets[id]){
            return;
        }

        bullets[id].deleteMe = true;
        delete bullets[id];
    }

    function clear(){
        Object.keys(bullets).forEach(function(id){
            remove(id);
        });
    }

    function reset(){
        bullets = {};
    }

    return {
        all: function(){
            return bullets;
        },
        clear: clear,
        fire: fire,
        remove: remove,
        reset: reset
    };
};
