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

                if(body.type === 'polygon'){
                    return circlePolygonOverlap(testCircle, body.points);
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

    function circlePolygonOverlap(circle, points){
        var i;
        var next;

        if(pointInPolygon(circle, points)){
            return true;
        }

        for(i = 0; i < points.length; i++){
            next = (i + 1) % points.length;

            if(circleLineOverlap(circle, points[i], points[next])){
                return true;
            }
        }

        return false;
    }

    function pointInPolygon(point, points){
        var inside = false;
        var i;
        var j;
        var intersects;

        for(i = 0, j = points.length - 1; i < points.length; j = i++){
            intersects = ((points[i].y > point.y) !== (points[j].y > point.y)) &&
                point.x < ((points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y)) + points[i].x;

            if(intersects){
                inside = !inside;
            }
        }

        return inside;
    }

    function circleLineOverlap(circle, start, end){
        var lineX = end.x - start.x;
        var lineY = end.y - start.y;
        var lengthSquared = (lineX * lineX) + (lineY * lineY);
        var progress;
        var closestX;
        var closestY;
        var dx;
        var dy;

        if(lengthSquared === 0){
            return circlesOverlap(circle, {
                x: start.x,
                y: start.y,
                radius: 0
            });
        }

        progress = ((circle.x - start.x) * lineX + (circle.y - start.y) * lineY) / lengthSquared;
        progress = Math.max(0, Math.min(1, progress));
        closestX = start.x + (progress * lineX);
        closestY = start.y + (progress * lineY);
        dx = circle.x - closestX;
        dy = circle.y - closestY;

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
