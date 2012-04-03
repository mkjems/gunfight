
var schedule = (function(){
    
    var events = [];
    
    function sortEventsByTime(){
        
    }
    
    function addEvent(event){
        events.push(event);    
    }
    
    function getEventsForInterval(interval){
    }
    
    var shared = {
       addEvent: addEvent,
       getEventsForInterval: getEventsForInterval
    };
    
    return shared;    
}());
