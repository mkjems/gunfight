
GF.KeysModel = function(socket, schedule){
    
    var keyStatus = {};
    var internalKeyStatus = {};

    function addKey(strKeyToAdd){
        
        $(document).bind('keydown', strKeyToAdd ,function (evt){ // Using hotkeys
            if(!internalKeyStatus[strKeyToAdd]){
                socket.emit('keydown', { key: strKeyToAdd });
            }
            internalKeyStatus[strKeyToAdd] = true;
        });
        
        $(document).bind('keyup', strKeyToAdd,function (evt){ // Using hotkeys
            if(internalKeyStatus[strKeyToAdd]){
                socket.emit('keyup', { key: strKeyToAdd });
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
    
    
    socket.on('keyEvent', function (keyEvent) {
        //keyStatus[keyEvent.key] = true;
        schedule.addEvent(keyEvent);
        //console.log(keyEvent.key);
    });
    
    
    var shared = {
       isDown: isKeyDown
    };
    
    return shared;    
};
