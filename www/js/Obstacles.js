GF.Obstacles = (function(){
    var bodies = [];

    function setCircles(nextCircles){
        bodies = (nextCircles || []).map(function(circle){
            return {
                type: 'circle',
                x: circle.x,
                y: circle.y,
                radius: circle.radius
            };
        });
    }

    function setBodies(nextBodies){
        bodies = nextBodies || [];
    }

    function collidesWithAny(testCircles){
        return testCircles.some(function(testCircle){
            return bodies.some(function(body){
                if(body.type === 'rect'){
                    return circleRectOverlap(testCircle, body);
                }

                return circlesOverlap(testCircle, body);
            });
        });
    }

    function circlesOverlap(a, b){
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var radius = a.radius + b.radius;

        return (dx * dx) + (dy * dy) < radius * radius;
    }

    function circleRectOverlap(circle, rect){
        var closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        var closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        var dx = circle.x - closestX;
        var dy = circle.y - closestY;

        return (dx * dx) + (dy * dy) < circle.radius * circle.radius;
    }

    function all(){
        return bodies;
    }

    return {
        all: all,
        collidesWithAny: collidesWithAny,
        setBodies: setBodies,
        setCircles: setCircles
    };
}());
