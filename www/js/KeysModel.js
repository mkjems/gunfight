
GF.KeysModel = function(socket, playerId){
    var internalKeyStatus = {};

    function addKey(strKeyToAdd){

        document.addEventListener('keydown', function(evt){
            if(evt.key !== strKeyToAdd){
                return;
            }
            if(!internalKeyStatus[strKeyToAdd]){
                socket.emit('clientKeyEvent', { 
                    key: strKeyToAdd,
                    player: playerId,
                    action: 'down' 
                });
            }
            internalKeyStatus[strKeyToAdd] = true;
        });
        
        document.addEventListener('keyup', function(evt){
            if(evt.key !== strKeyToAdd){
                return;
            }
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
        return internalKeyStatus[key] ? true: false;
    }
    
    var shared = {
       isDown: isKeyDown
    };
    
    return shared;    
};
