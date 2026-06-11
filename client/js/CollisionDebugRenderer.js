GF.CollisionDebugRenderer = function (context) {
    function render(options) {
        if (!GF.Config.debug.showCollisionBodies) {
            return;
        }

        drawBodies(options.obstacleBodies, 'rgba(255, 80, 80, 0.75)');

        Object.keys(options.players || {}).forEach(function (id) {
            drawCircles(
                options.players[id].getCollisionCircles(),
                'rgba(80, 180, 255, 0.8)'
            );
        });
    }

    function drawBodies(bodies, color) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        (bodies || []).forEach(function (body) {
            if (body.type === 'rect') {
                context.strokeRect(body.x, body.y, body.width, body.height);
                return;
            }

            if (body.type === 'polygon') {
                drawPolygon(body.points);
                return;
            }

            drawCircle(body);
        });

        context.restore();
    }

    function drawCircles(circles, color) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        (circles || []).forEach(function (circle) {
            drawCircle(circle);
        });

        context.restore();
    }

    function drawCircle(circle) {
        context.beginPath();
        context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        context.stroke();
    }

    function drawPolygon(points) {
        if (!points.length) {
            return;
        }

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(function (point) {
            context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.stroke();
    }

    return {
        drawBodies: drawBodies,
        drawCircles: drawCircles,
        render: render
    };
};
