
GF.Schedule = function() {
    
    var events = [];
    
    function compareTime(a,b) {
      if (a.eventTime < b.eventTime)
         return -1;
      if (a.eventTime > b.eventTime)
        return 1;
      return 0;
    }
    
    function getEventObj(){
        return{
            eventTime: undefined,
            eventName: undefined
        };
    }
     
    function addEvent(event){
        events.push(event);
        events.sort(compareTime);  
    }

    function addEvents(events){ // events array
        events.forEach(function(val, index, arr){
            events.push(val);
        });
        events.sort(compareTime);            
    }
        
    function checkForFrameEvents(){ 
        var t = new Date().getTime();
        var res = [];
        while(events.length >0 && events[0].eventTime < t){
            res.push(events.shift());
        }
        return res;
    }
    
    var shared = {
       getEventObj: getEventObj, 
       addEvent: addEvent,
       checkForFrameEvents: checkForFrameEvents
    };
    
    return shared;    
};
