
GF.KeysModel = function(socket, playerId){
    var internalKeyStatus = {};

    function addKey(strKeyToAdd){

        document.addEventListener('keydown', function(evt){
            if(evt.key !== strKeyToAdd){
                return;
            }
            evt.preventDefault();
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
            evt.preventDefault();
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

    function bindReadyKey(){
        document.addEventListener('keydown', function(evt){
            if(evt.key !== 'p' && evt.key !== 'P'){
                return;
            }

            evt.preventDefault();

            if(!internalKeyStatus.p){
                socket.emit('clientReady');
            }

            internalKeyStatus.p = true;
        });

        document.addEventListener('keyup', function(evt){
            if(evt.key !== 'p' && evt.key !== 'P'){
                return;
            }

            evt.preventDefault();
            internalKeyStatus.p = false;
        });
    }
    
    ['h', 'j', 'k', 'l', 'a', 'z', ' '].forEach(function(val){
        addKey(val);
    });

    bindReadyKey();
        
    function isKeyDown(key){
        return internalKeyStatus[key] ? true: false;
    }
    
    var shared = {
       isDown: isKeyDown
    };
    
    return shared;    
};
