
GF.Schedule = function(){
    var events = [];
    
    function compareTime(a,b) {
        if(a.eventTime < b.eventTime){
            return -1;
        }
        if(a.eventTime > b.eventTime){
            return 1;
        }
        return 0;
    }
    
    function getEventObj(){
        return {
            eventTime: undefined,
            eventName: undefined
        };
    }
     
    function addEvent(event){
        events.push(event);
        events.sort(compareTime);  
    }
        
    function checkForFrameEvents(){ 
        var t = new Date().getTime();
        var res = [];
        while(events.length > 0 && events[0].eventTime < t){
            res.push(events.shift());
        }
        return res;
    }
    
    return {
       getEventObj: getEventObj, 
       addEvent: addEvent,
       checkForFrameEvents: checkForFrameEvents
    };
};
