
GF.KeysModel = function(socket, playerId, onLocalKeyEvent){
    var internalKeyStatus = {};

    function emitKeyEvent(key, action){
        var keyEvent = {
            key: key,
            player: playerId,
            action: action
        };

        onLocalKeyEvent(keyEvent);
        socket.emit('clientKeyEvent', keyEvent);
    }

    function normalizeKey(key){
        return key.length === 1 ? key.toLowerCase() : key;
    }

    function addKey(strKeyToAdd){

        document.addEventListener('keydown', function(evt){
            if(normalizeKey(evt.key) !== strKeyToAdd){
                return;
            }
            evt.preventDefault();
            if(!internalKeyStatus[strKeyToAdd]){
                emitKeyEvent(strKeyToAdd, 'down');
            }
            internalKeyStatus[strKeyToAdd] = true;
        });
        
        document.addEventListener('keyup', function(evt){
            if(normalizeKey(evt.key) !== strKeyToAdd){
                return;
            }
            evt.preventDefault();
            if(internalKeyStatus[strKeyToAdd]){
                emitKeyEvent(strKeyToAdd, 'up');
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
