GF.Players = function(scene, bullets){
    var players = {};

    function getSlot(index){
        var slots = GF.Config.player.slots;

        return slots[index % slots.length];
    }

    function ensure(client, index, options){
        options = options || {};
        var slot = getSlot(index);
        var id = client.id;
        var slotChanged;

        if(players[id]){
            slotChanged = players[id].slot !== index;
            players[id].playerId = id;
            players[id].slot = index;
            players[id].facing = slot.facing;
            players[id].idleFrame = slot.frame;

            if(slotChanged && options.resetChangedSlots){
                players[id].resetTo(slot);
            }

            return;
        }

        players[id] = new GF.Controllable(slot.x, slot.y, {
            playerId: id,
            facing: slot.facing,
            frame: slot.frame
        });
        players[id].slot = index;
        scene.addFigure(players[id]);
    }

    function sync(model, options){
        var activePlayers = {};

        model.clients.forEach(function(client, index){
            activePlayers[client.id] = true;
            ensure(client, index, options);
        });

        Object.keys(players).forEach(function(id){
            if(!activePlayers[id]){
                players[id].deleteMe = true;
                bullets.remove(id);
                delete players[id];
            }
        });
    }

    function resetAll(){
        Object.keys(players).forEach(function(id){
            var player = players[id];
            var slot = getSlot(player.slot);

            player.resetTo(slot);
        });
    }

    function clearKeys(){
        Object.keys(players).forEach(function(id){
            players[id].clearKeys();
        });
    }

    function label(id){
        if(!players[id]){
            return id;
        }

        return players[id].slot + 1;
    }

    return {
        all: players,
        clearKeys: clearKeys,
        label: label,
        resetAll: resetAll,
        sync: sync
    };
};
