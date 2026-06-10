
GF.KeysModel = function(socket, playerId, onLocalKeyEvent, options){
    options = options || {};

    var internalKeyStatus = {};
    var inputKeys = ['h', 'j', 'k', 'l', 'a', 'z', ' ', 'e'];

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

    function press(key){
        key = normalizeKey(key);

        if(internalKeyStatus[key]){
            return;
        }

        emitKeyEvent(key, 'down');
        internalKeyStatus[key] = true;
    }

    function release(key){
        key = normalizeKey(key);

        if(!internalKeyStatus[key]){
            return;
        }

        emitKeyEvent(key, 'up');
        internalKeyStatus[key] = false;
    }

    function ready(){
        if(options.canReady && !options.canReady()){
            return;
        }

        if(internalKeyStatus.p){
            return;
        }

        socket.emit('clientReady');
        internalKeyStatus.p = true;

        if(options.onReady){
            options.onReady();
        }
    }

    function releaseReady(){
        internalKeyStatus.p = false;
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
            press(strKeyToAdd);
        });
        
        document.addEventListener('keyup', function(evt){
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

            if(normalizeKey(evt.key) !== strKeyToAdd){
                return;
            }
            evt.preventDefault();
            release(strKeyToAdd);
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
            ready();
        });

        document.addEventListener('keyup', function(evt){
            if(shouldIgnoreKeyboardEvent(evt)){
                return;
            }

            if(evt.key !== 'p' && evt.key !== 'P'){
                return;
            }

            evt.preventDefault();
            releaseReady();
        });
    }
    
    inputKeys.forEach(function(val){
        addKey(val);
    });

    bindReadyKey();
        
    function isKeyDown(key){
        return internalKeyStatus[key] ? true: false;
    }
    
    var shared = {
       isDown: isKeyDown,
       press: press,
       ready: ready,
       release: release,
       releaseReady: releaseReady
    };
    
    return shared;    
};
