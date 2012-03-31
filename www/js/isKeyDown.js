
var keys = (function(){
    
    var keyStatus = {};

    function addKey(strKeyToAdd){
        $(document).bind('keydown', strKeyToAdd ,function (evt){ // Using hotkeys
            keyStatus[strKeyToAdd] = true;
        });
        
        $(document).bind('keyup', strKeyToAdd,function (evt){ // Using hotkeys
            keyStatus[strKeyToAdd] = false;
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
}());
