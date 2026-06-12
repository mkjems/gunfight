type Circle = {
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

type CircleBody = Circle & {
    type?: 'circle';
};

type PolygonBody = {
    points: Point[];
    type: 'polygon';
};

type Point = {
    x: number;
    y: number;
};

type ObstacleBody = CircleBody | PolygonBody | RectBody;

let bodies: ObstacleBody[] = [];

export function setCircles(nextCircles: Circle[] = []) {
    bodies = nextCircles.map(function (circle) {
        return {
            type: 'circle' as const,
            x: circle.x,
            y: circle.y,
            radius: circle.radius
        };
    });
}

export function setBodies(nextBodies: ObstacleBody[] = []) {
    bodies = nextBodies;
}

export function collidesWithAny(testCircles: Circle[]) {
    return testCircles.some(function (testCircle) {
        return bodies.some(function (body) {
            if (body.type === 'rect') {
                return circleRectOverlap(testCircle, body);
            }

            if (body.type === 'polygon') {
                return circlePolygonOverlap(testCircle, body.points);
            }

            return circlesOverlap(testCircle, body);
        });
    });
}

function circlesOverlap(a: Circle, b: Circle) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const radius = a.radius + b.radius;

    return dx * dx + dy * dy < radius * radius;
}

function circleRectOverlap(circle: Circle, rect: RectBody) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy < circle.radius * circle.radius;
}

function circlePolygonOverlap(circle: Circle, points: Point[]) {
    if (pointInPolygon(circle, points)) {
        return true;
    }

    for (let i = 0; i < points.length; i += 1) {
        const next = (i + 1) % points.length;

        if (circleLineOverlap(circle, points[i], points[next])) {
            return true;
        }
    }

    return false;
}

function pointInPolygon(point: Point, points: Point[]) {
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const intersects =
            points[i].y > point.y !== points[j].y > point.y &&
            point.x <
                ((points[j].x - points[i].x) * (point.y - points[i].y)) /
                    (points[j].y - points[i].y) +
                    points[i].x;

        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
}

function circleLineOverlap(circle: Circle, start: Point, end: Point) {
    const lineX = end.x - start.x;
    const lineY = end.y - start.y;
    const lengthSquared = lineX * lineX + lineY * lineY;

    if (lengthSquared === 0) {
        return circlesOverlap(circle, {
            x: start.x,
            y: start.y,
            radius: 0
        });
    }

    let progress =
        ((circle.x - start.x) * lineX + (circle.y - start.y) * lineY) /
        lengthSquared;
    progress = Math.max(0, Math.min(1, progress));
    const closestX = start.x + progress * lineX;
    const closestY = start.y + progress * lineY;
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy < circle.radius * circle.radius;
}

export function all() {
    return bodies;
}

export const Obstacles = {
    all,
    collidesWithAny,
    setBodies,
    setCircles
};
