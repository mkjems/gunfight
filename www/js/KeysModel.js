
GF.KeysModel = function(socket, schedule, playerId){
    
    var keyStatus = {};
    var internalKeyStatus = {};

    function addKey(strKeyToAdd){
        
        $(document).bind('keydown', strKeyToAdd ,function (evt){ // Using hotkeys
            if(!internalKeyStatus[strKeyToAdd]){
                socket.emit('clientKeyEvent', { 
                    key: strKeyToAdd,
                    player: playerId,
                    action: 'down' 
                });
            }
            internalKeyStatus[strKeyToAdd] = true;
        });
        
        $(document).bind('keyup', strKeyToAdd,function (evt){ // Using hotkeys
            if(internalKeyStatus[strKeyToAdd]){
                socket.emit('clientKeyEvent', { 
                    key: strKeyToAdd,
                    player: playerId,
                    action: 'up' 
                });
            }
            internalKeyStatus[strKeyToAdd] = false;
        });
    }
    
    ['h', 'j', 'k', 'l'].forEach(function(val){
        addKey(val);
    });
        
    function isKeyDown(key){
        return (keyStatus[key]) ? true: false;
    }
    
    var shared = {
       isDown: isKeyDown
    };
    
    return shared;    
};
