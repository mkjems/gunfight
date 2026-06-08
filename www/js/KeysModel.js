
GF.KeysModel = function(socket, playerId, onLocalKeyEvent, options){
    options = options || {};

    var internalKeyStatus = {};

    function emitKeyEvent(key, action){
        var keyEvent = {
            key: key,
            player: playerId,
            action: action
        };
        var result;

        result = onLocalKeyEvent(keyEvent);

        if(result === false){
            return;
        }

        socket.emit('clientKeyEvent', keyEvent);
    }

    function normalizeKey(key){
        return key.length === 1 ? key.toLowerCase() : key;
    }

    function shouldIgnoreKeyboardEvent(evt){
        var target = evt.target;
        var tagName = target && target.tagName;

        return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || (target && target.isContentEditable);
    }

    function addKey(strKeyToAdd){

        document.addEventListener('keydown', function(evt){
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

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
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

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
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

            if(evt.key !== 'p' && evt.key !== 'P'){
                return;
            }

            evt.preventDefault();

            if(options.canReady && !options.canReady()){
                return;
            }

            if(!internalKeyStatus.p){
                socket.emit('clientReady');
            }

            internalKeyStatus.p = true;
        });

        document.addEventListener('keyup', function(evt){
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

            if(evt.key !== 'p' && evt.key !== 'P'){
                return;
            }

            evt.preventDefault();
            internalKeyStatus.p = false;
        });
    }
    
    ['h', 'j', 'k', 'l', 'a', 'z', ' ', 'e'].forEach(function(val){
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
