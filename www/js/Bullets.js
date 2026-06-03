GF.Bullets = function(scene){
    var bullets = {};

    function fire(player){
        var activeBullet = bullets[player.playerId];

        if(activeBullet && !activeBullet.deleteMe){
            return;
        }

        bullets[player.playerId] = new GF.Bullet(player);
        scene.addFigure(bullets[player.playerId]);
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
