import { Config } from './config.js';

type CollisionContext = {
    arc: (
        x: number,
        y: number,
        radius: number,
        start: number,
        end: number
    ) => void;
    beginPath: () => void;
    closePath: () => void;
    lineTo: (x: number, y: number) => void;
    lineWidth: number;
    moveTo: (x: number, y: number) => void;
    restore: () => void;
    save: () => void;
    stroke: () => void;
    strokeRect: (x: number, y: number, width: number, height: number) => void;
    strokeStyle: string;
};

type CircleBody = {
    radius: number;
    x: number;
    y: number;
};

type RectBody = {
    height: number;
    type: 'rect';
    width: number;
    x: number;
    y: number;
};

type PolygonBody = {
    points: Array<{
        x: number;
        y: number;
    }>;
    type: 'polygon';
};

type CollisionBody = CircleBody | RectBody | PolygonBody;

type CollisionDebugRendererOptions = {
    showCollisionBodies?: boolean;
};

export function CollisionDebugRenderer(
    context: CollisionContext,
    options: CollisionDebugRendererOptions = {}
) {
    const showCollisionBodies =
        options.showCollisionBodies ?? Config.debug.showCollisionBodies;

    function render(options: {
        obstacleBodies?: CollisionBody[];
        players?: Record<
            string,
            {
                getCollisionCircles: () => CircleBody[];
            }
        >;
    }) {
        if (!showCollisionBodies) {
            return;
        }

        drawBodies(options.obstacleBodies, 'rgba(255, 80, 80, 0.75)');

        Object.keys(options.players || {}).forEach(function (id) {
            drawCircles(
                options.players?.[id].getCollisionCircles(),
                'rgba(80, 180, 255, 0.8)'
            );
        });
    }

    function drawBodies(bodies: CollisionBody[] | undefined, color: string) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        (bodies || []).forEach(function (body) {
            if ('type' in body && body.type === 'rect') {
                context.strokeRect(body.x, body.y, body.width, body.height);
                return;
            }

            if ('type' in body && body.type === 'polygon') {
                drawPolygon(body.points);
                return;
            }

            drawCircle(body);
        });

        context.restore();
    }

    function drawCircles(circles: CircleBody[] | undefined, color: string) {
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 2;

        (circles || []).forEach(function (circle) {
            drawCircle(circle);
        });

        context.restore();
    }

    function drawCircle(circle: CircleBody) {
        context.beginPath();
        context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        context.stroke();
    }

    function drawPolygon(points: PolygonBody['points']) {
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
        drawBodies,
        drawCircles,
        render
    };
}
