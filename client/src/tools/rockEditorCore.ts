import {
    parseRockDefinitions,
    type LineSegment,
    type RockDefinition,
    type RockDefinitions
} from '../../../shared/contracts.js';

export type Point = {
    x: number;
    y: number;
};

export type RockBounds = {
    height: number;
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
    width: number;
};

export type RockEditorDocument = {
    definitions: RockDefinitions;
    selectedType: string;
};

export type RockValidationResult = {
    bounds: RockBounds | null;
    errors: string[];
    valid: boolean;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_SINGLE_ROCK_TYPE = 'rock';
const MINIMUM_POLYGON_POINTS = 3;
const POINT_EPSILON = 0.0001;

export const DEFAULT_ROCK_EDITOR_JSON = JSON.stringify(
    {
        small: {
            lines: [
                { from: [-34, -8], to: [-10, -22] },
                { from: [-10, -22], to: [14, -18] },
                { from: [14, -18], to: [28, -2] },
                { from: [28, -2], to: [16, 18] },
                { from: [16, 18], to: [-38, 16] },
                { from: [-38, 16], to: [-34, -8] }
            ]
        },
        tall: {
            lines: [
                { from: [-16, -36], to: [10, -42] },
                { from: [10, -42], to: [24, -18] },
                { from: [24, -18], to: [18, 34] },
                { from: [18, 34], to: [-14, 38] },
                { from: [-14, 38], to: [-24, 8] },
                { from: [-24, 8], to: [-16, -36] }
            ]
        }
    },
    null,
    4
);

export function parseRockEditorJson(
    source: string,
    preferredType?: string
): RockEditorDocument {
    let parsed: unknown;

    try {
        parsed = JSON.parse(source);
    } catch (error) {
        throw new Error(
            'Input JSON: ' +
                (error instanceof Error ? error.message : 'invalid JSON')
        );
    }

    if (isSingleRockDefinition(parsed)) {
        const selectedType = normalizeRockType(preferredType);

        return {
            definitions: parseRockDefinitions(
                {
                    [selectedType]: parsed
                },
                'rock JSON'
            ),
            selectedType
        };
    }

    const definitions = parseRockDefinitions(parsed, 'rock JSON');
    const selectedType =
        preferredType && definitions[preferredType]
            ? preferredType
            : Object.keys(definitions)[0];

    return {
        definitions,
        selectedType
    };
}

export function formatRockDefinitions(definitions: RockDefinitions): string {
    return JSON.stringify(definitions, null, 4) + '\n';
}

export function validateRockCollection(definitions: RockDefinitions): string[] {
    return Object.entries(definitions).flatMap(function ([type, definition]) {
        return validateRockDefinition(definition).errors.map(function (error) {
            return type + ': ' + error;
        });
    });
}

export function validateRockDefinition(
    definition: RockDefinition
): RockValidationResult {
    const errors: string[] = [];
    const lines = definition.lines;
    const points = definitionToPoints(definition);
    const bounds = calculateRockBounds(points);

    if (lines.length < MINIMUM_POLYGON_POINTS) {
        errors.push('Use at least 3 points so the rock has a filled shape.');
    }

    lines.forEach(function (line, index) {
        if (pointsEqual(toPoint(line.from), toPoint(line.to))) {
            errors.push('Line ' + (index + 1) + ' has no length.');
        }
    });

    lines.forEach(function (line, index) {
        const nextIndex = (index + 1) % lines.length;
        const nextLine = lines[nextIndex];

        if (!pointsEqual(toPoint(line.to), toPoint(nextLine.from))) {
            errors.push(
                'Line ' +
                    (index + 1) +
                    ' must end where line ' +
                    (nextIndex + 1) +
                    ' starts.'
            );
        }
    });

    if (countDistinctPoints(points) < MINIMUM_POLYGON_POINTS) {
        errors.push('Use at least 3 different points.');
    }

    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
        errors.push('Give the rock both width and height.');
    }

    if (Math.abs(calculateSignedArea(points)) < POINT_EPSILON) {
        errors.push('Arrange the points so they enclose an area.');
    }

    const crossing = findCrossingEdges(points);

    if (crossing) {
        errors.push(
            'Edges ' +
                crossing.first +
                ' and ' +
                crossing.second +
                ' cross; move a point to untangle the shape.'
        );
    }

    return {
        bounds,
        errors,
        valid: errors.length === 0
    };
}

export function definitionToPoints(definition: RockDefinition): Point[] {
    return definition.lines.map(function (line) {
        return toPoint(line.from);
    });
}

export function pointsToDefinition(points: Point[]): RockDefinition {
    return {
        lines: points.map(function (point, index) {
            const next = points[(index + 1) % points.length];

            return {
                from: [cleanNumber(point.x), cleanNumber(point.y)],
                to: [cleanNumber(next.x), cleanNumber(next.y)]
            };
        })
    };
}

export function updateRockPoint(
    definition: RockDefinition,
    pointIndex: number,
    point: Point
): RockDefinition {
    const points = definitionToPoints(definition);

    if (!points[pointIndex]) {
        return definition;
    }

    points[pointIndex] = {
        x: cleanNumber(point.x),
        y: cleanNumber(point.y)
    };

    return pointsToDefinition(points);
}

export function insertPointAfter(
    definition: RockDefinition,
    pointIndex: number
): RockDefinition {
    const points = definitionToPoints(definition);
    const start = points[pointIndex];
    const end = points[(pointIndex + 1) % points.length];

    if (!start || !end) {
        return definition;
    }

    points.splice(pointIndex + 1, 0, {
        x: cleanNumber((start.x + end.x) / 2),
        y: cleanNumber((start.y + end.y) / 2)
    });

    return pointsToDefinition(points);
}

export function removePointAt(
    definition: RockDefinition,
    pointIndex: number
): RockDefinition {
    const points = definitionToPoints(definition);

    if (points.length <= MINIMUM_POLYGON_POINTS || !points[pointIndex]) {
        return definition;
    }

    points.splice(pointIndex, 1);

    return pointsToDefinition(points);
}

export function scaleRockDefinition(
    definition: RockDefinition,
    width: number,
    height: number
): RockDefinition {
    const points = definitionToPoints(definition);
    const bounds = calculateRockBounds(points);

    if (!bounds || width <= 0 || height <= 0) {
        return definition;
    }

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;

    return pointsToDefinition(
        points.map(function (point) {
            return {
                x: centerX + (point.x - centerX) * scaleX,
                y: centerY + (point.y - centerY) * scaleY
            };
        })
    );
}

export function setRockDefinition(
    definitions: RockDefinitions,
    type: string,
    definition: RockDefinition
): RockDefinitions {
    return {
        ...definitions,
        [type]: copyRockDefinition(definition)
    };
}

export function renameRockDefinition(
    definitions: RockDefinitions,
    oldType: string,
    newType: string
): RockDefinitions {
    const normalizedType = normalizeRockType(newType);
    const renamed: RockDefinitions = {};

    Object.entries(definitions).forEach(function ([type, definition]) {
        renamed[type === oldType ? normalizedType : type] =
            copyRockDefinition(definition);
    });

    return renamed;
}

export function duplicateRockDefinition(
    definitions: RockDefinitions,
    sourceType: string
): {
    definitions: RockDefinitions;
    selectedType: string;
} {
    const source = definitions[sourceType];
    let copyIndex = 2;
    let nextType = sourceType + '-' + copyIndex;

    while (definitions[nextType]) {
        copyIndex += 1;
        nextType = sourceType + '-' + copyIndex;
    }

    return {
        definitions: {
            ...definitions,
            [nextType]: copyRockDefinition(source)
        },
        selectedType: nextType
    };
}

export function calculateRockBounds(points: Point[]): RockBounds | null {
    if (points.length === 0) {
        return null;
    }

    const xs = points.map(function (point) {
        return point.x;
    });
    const ys = points.map(function (point) {
        return point.y;
    });
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
        height: cleanNumber(maxY - minY),
        maxX,
        maxY,
        minX,
        minY,
        width: cleanNumber(maxX - minX)
    };
}

export function normalizeRockType(type: string | undefined): string {
    const normalized = (type || DEFAULT_SINGLE_ROCK_TYPE)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || DEFAULT_SINGLE_ROCK_TYPE;
}

function isSingleRockDefinition(value: unknown): value is RockDefinition {
    return isRecord(value) && Array.isArray(value.lines);
}

function isRecord(value: unknown): value is JsonRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toPoint(point: [number, number]): Point {
    return {
        x: point[0],
        y: point[1]
    };
}

function pointsEqual(a: Point, b: Point): boolean {
    return (
        Math.abs(a.x - b.x) < POINT_EPSILON &&
        Math.abs(a.y - b.y) < POINT_EPSILON
    );
}

function countDistinctPoints(points: Point[]): number {
    const keys = new Set(
        points.map(function (point) {
            return cleanNumber(point.x) + ',' + cleanNumber(point.y);
        })
    );

    return keys.size;
}

function calculateSignedArea(points: Point[]): number {
    let area = 0;

    points.forEach(function (point, index) {
        const next = points[(index + 1) % points.length];

        area += point.x * next.y - next.x * point.y;
    });

    return area / 2;
}

function findCrossingEdges(points: Point[]): {
    first: number;
    second: number;
} | null {
    for (let first = 0; first < points.length; first += 1) {
        const firstNext = (first + 1) % points.length;

        for (let second = first + 1; second < points.length; second += 1) {
            const secondNext = (second + 1) % points.length;

            if (
                firstNext === second ||
                secondNext === first ||
                (first === 0 && secondNext === 0)
            ) {
                continue;
            }

            if (
                segmentsIntersect(
                    points[first],
                    points[firstNext],
                    points[second],
                    points[secondNext]
                )
            ) {
                return {
                    first: first + 1,
                    second: second + 1
                };
            }
        }
    }

    return null;
}

function segmentsIntersect(
    firstStart: Point,
    firstEnd: Point,
    secondStart: Point,
    secondEnd: Point
): boolean {
    const firstOrientation = getOrientation(firstStart, firstEnd, secondStart);
    const secondOrientation = getOrientation(firstStart, firstEnd, secondEnd);
    const thirdOrientation = getOrientation(secondStart, secondEnd, firstStart);
    const fourthOrientation = getOrientation(secondStart, secondEnd, firstEnd);

    if (
        firstOrientation !== secondOrientation &&
        thirdOrientation !== fourthOrientation
    ) {
        return true;
    }

    return (
        (firstOrientation === 0 &&
            pointOnSegment(firstStart, secondStart, firstEnd)) ||
        (secondOrientation === 0 &&
            pointOnSegment(firstStart, secondEnd, firstEnd)) ||
        (thirdOrientation === 0 &&
            pointOnSegment(secondStart, firstStart, secondEnd)) ||
        (fourthOrientation === 0 &&
            pointOnSegment(secondStart, firstEnd, secondEnd))
    );
}

function getOrientation(a: Point, b: Point, c: Point): -1 | 0 | 1 {
    const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

    if (Math.abs(value) < POINT_EPSILON) {
        return 0;
    }

    return value > 0 ? 1 : -1;
}

function pointOnSegment(start: Point, point: Point, end: Point): boolean {
    return (
        point.x <= Math.max(start.x, end.x) + POINT_EPSILON &&
        point.x + POINT_EPSILON >= Math.min(start.x, end.x) &&
        point.y <= Math.max(start.y, end.y) + POINT_EPSILON &&
        point.y + POINT_EPSILON >= Math.min(start.y, end.y)
    );
}

function copyRockDefinition(definition: RockDefinition): RockDefinition {
    return {
        lines: definition.lines.map(function (line) {
            return copyLine(line);
        })
    };
}

function copyLine(line: LineSegment): LineSegment {
    return {
        from: [line.from[0], line.from[1]],
        to: [line.to[0], line.to[1]]
    };
}

function cleanNumber(value: number): number {
    const rounded = Math.round(value * 100) / 100;

    return Object.is(rounded, -0) ? 0 : rounded;
}
