import { Collision } from './collision.js';
import { Config } from '../platform/config.js';

type ContextLike = {
    beginPath: () => void;
    closePath: () => void;
    drawImage: CanvasRenderingContext2D['drawImage'];
    fill: () => void;
    fillRect: (x: number, y: number, width: number, height: number) => void;
    fillStyle: unknown;
    lineTo: (x: number, y: number) => void;
    moveTo: (x: number, y: number) => void;
    restore: () => void;
    save: () => void;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
};

type SpriteLike = CanvasImageSource & {
    complete?: boolean;
};

type ScenarioRendererOptions = {
    context: ContextLike;
    getObstacleDamage?: (id: string) => number;
    getRockPattern?: () => CanvasPattern | null;
    getScenarioStartedAt?: () => number | null;
    getTime?: () => number;
    sprites?: {
        cactus?: SpriteLike;
        saloon?: SpriteLike;
        wagon?: SpriteLike;
    };
};

type Scenario = {
    cacti?: Array<{
        x: number;
        y: number;
    }>;
    decorations?: Array<{
        type: string;
        x: number;
        y: number;
    }>;
    rocks?: Rock[];
    wagon?: Wagon;
};

type Rock = {
    lines?: RockLine[];
    x: number;
    y: number;
};

type RockLine = {
    from: [number, number];
    to: [number, number];
};

type Wagon = {
    duration?: number;
    fromY: number;
    toY: number;
    x: number;
};

type Box = {
    height: number;
    width: number;
    x: number;
    y: number;
};

type CircleBody = {
    damage?: number;
    id?: string;
    radius: number;
    type: 'circle';
    x: number;
    y: number;
};

type RectBody = Box & {
    damage: number;
    id: string;
    type: 'rect';
};

type PolygonBody = {
    points: Array<{
        x: number;
        y: number;
    }>;
    type: 'polygon';
};

type ObstacleBody = CircleBody | PolygonBody | RectBody;

type BulletLike = {
    deleteMe?: boolean;
    getHitBox: () => Box;
};

export function ScenarioRenderer(options: ScenarioRendererOptions) {
    const context = options.context;
    const getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    const getObstacleDamage =
        options.getObstacleDamage ||
        function () {
            return 0;
        };
    const getScenarioStartedAt =
        options.getScenarioStartedAt ||
        function () {
            return null;
        };
    const getRockPattern =
        options.getRockPattern ||
        function () {
            return null;
        };
    const sprites = options.sprites || {};

    function render(scenario: Scenario | null | undefined) {
        if (!scenario) {
            return;
        }

        drawDecorations(scenario);

        (scenario.cacti || []).forEach(function (cactus, index) {
            drawCactus(cactus.x, cactus.y, getCactusDamageStage(index));
        });

        drawRocks(scenario);

        if (scenario.wagon) {
            drawWagon(scenario.wagon);
        }
    }

    function drawDecorations(scenario: Scenario) {
        (scenario.decorations || []).forEach(function (decoration) {
            if (decoration.type === 'saloon') {
                drawSaloon(decoration.x, decoration.y);
            }
        });
    }

    function drawSaloon(x: number, y: number) {
        const scale = Config.graphics.scale;
        const width = 64 * scale;
        const height = 128 * scale;
        const saloonSprite = sprites.saloon;

        if (!saloonSprite || !saloonSprite.complete) {
            return;
        }

        context.drawImage(saloonSprite, x, y, width, height);
    }

    function drawRocks(scenario: Scenario) {
        (scenario.rocks || []).forEach(function (rock) {
            const lines = rock.lines || [];
            const firstLine = lines[0];

            if (!firstLine) {
                return;
            }

            context.save();
            context.fillStyle = getRockPattern() || Config.colors.yellow;
            context.shadowColor = 'rgb(0,0,0)';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.beginPath();
            context.moveTo(
                rock.x + firstLine.from[0],
                rock.y + firstLine.from[1]
            );

            lines.forEach(function (line) {
                context.lineTo(rock.x + line.to[0], rock.y + line.to[1]);
            });

            context.closePath();
            context.fill();
            context.restore();
        });
    }

    function getRockLines(scenario: Scenario | null | undefined) {
        const lines: Array<{
            x1: number;
            x2: number;
            y1: number;
            y2: number;
        }> = [];

        if (!scenario) {
            return lines;
        }

        (scenario.rocks || []).forEach(function (rock) {
            (rock.lines || []).forEach(function (line) {
                lines.push({
                    x1: rock.x + line.from[0],
                    y1: rock.y + line.from[1],
                    x2: rock.x + line.to[0],
                    y2: rock.y + line.to[1]
                });
            });
        });

        return lines;
    }

    function getObstacleBodies(scenario: Scenario | null | undefined) {
        const bodies: ObstacleBody[] = [];

        if (!scenario) {
            return bodies;
        }

        (scenario.cacti || []).forEach(function (cactus, index) {
            const body = getCactusBody(cactus, index);

            if (body) {
                bodies.push(body);
            }
        });

        (scenario.rocks || []).forEach(function (rock) {
            bodies.push(getRockPolygonBody(rock));
        });

        if (scenario.wagon) {
            getWagonObstacleCircles(scenario.wagon).forEach(function (circle) {
                bodies.push(circle);
            });
        }

        return bodies;
    }

    function getDamageableObstacleBodies(
        scenario: Scenario | null | undefined
    ) {
        const bodies: Array<CircleBody | RectBody> = [];

        if (!scenario) {
            return bodies;
        }

        (scenario.cacti || []).forEach(function (cactus, index) {
            const body = getCactusBody(cactus, index);

            if (body) {
                bodies.push(body);
            }
        });

        if (scenario.wagon) {
            getWagonObstacleCircles(scenario.wagon).forEach(function (circle) {
                bodies.push(circle);
            });
        }

        return bodies;
    }

    function getRockPolygonBody(rock: Rock): PolygonBody {
        return {
            type: 'polygon',
            points: getRockPolygonPoints(rock)
        };
    }

    function getRockPolygonPoints(rock: Rock) {
        return (rock.lines || []).map(function (line) {
            return {
                x: rock.x + line.from[0],
                y: rock.y + line.from[1]
            };
        });
    }

    function getWagonObstacleCircles(wagon: Wagon): CircleBody[] {
        const position = getWagonPosition(wagon);
        const scale = Config.graphics.scale;
        const colliders = [
            { x: -7, y: 7, radius: 9 },
            { x: 7, y: 7, radius: 9 },
            { x: 0, y: -10, radius: 10 }
        ];

        return colliders.map(function (collider) {
            return {
                type: 'circle',
                id: 'wagon',
                damage: getObstacleDamage('wagon'),
                x: position.x + collider.x * scale,
                y: position.y + collider.y * scale,
                radius: collider.radius * scale
            };
        });
    }

    function getCactusBody(
        cactus: { x: number; y: number },
        index: number
    ): RectBody | null {
        const scale = Config.graphics.scale;
        const damage = getCactusDamageStage(index);
        const width = 5 * scale;
        const heights = [29, 22, 15, 0];
        const height = heights[damage] * scale;

        if (!height) {
            return null;
        }

        return {
            type: 'rect',
            id: getCactusId(index),
            damage,
            x: cactus.x - width / 2,
            y: cactus.y - height,
            width,
            height
        };
    }

    function getCactusId(index: number) {
        return 'cactus:' + index;
    }

    function getCactusDamageStage(index: number) {
        return Math.min(3, getObstacleDamage(getCactusId(index)));
    }

    function drawCactus(x: number, y: number, damage: number) {
        const scale = Config.graphics.scale;
        const sourceWidth = 17;
        const sourceHeight = 32;
        const frame = Math.min(3, damage);
        const width = sourceWidth * scale;
        const height = sourceHeight * scale;
        const cactusSprite = sprites.cactus;

        context.save();

        if (cactusSprite && cactusSprite.complete) {
            context.drawImage(
                cactusSprite,
                frame * sourceWidth,
                0,
                sourceWidth,
                sourceHeight,
                x - width / 2,
                y - height,
                width,
                height
            );
        } else {
            context.fillStyle = Config.colors.yellow;
            context.fillRect(x - width / 2, y - height, width, height);
        }

        context.restore();
    }

    function drawWagon(wagon: Wagon) {
        const position = getWagonPosition(wagon);
        const scale = Config.graphics.scale;
        const sourceWidth = 37;
        const sourceHeight = 38;
        const damage = Math.min(3, getObstacleDamage('wagon'));
        const width = sourceWidth * scale;
        const height = sourceHeight * scale;
        const wagonSprite = sprites.wagon;

        context.save();

        if (wagonSprite && wagonSprite.complete) {
            context.drawImage(
                wagonSprite,
                damage * sourceWidth,
                0,
                sourceWidth,
                sourceHeight,
                position.x - width / 2,
                position.y - height / 2,
                width,
                height
            );
        } else {
            context.fillStyle = Config.colors.yellow;
            context.fillRect(
                position.x - width / 2,
                position.y - height / 2,
                width,
                height
            );
        }

        context.restore();
    }

    function getWagonPosition(wagon: Wagon) {
        const scenarioStartedAt = getScenarioStartedAt();
        const elapsed = scenarioStartedAt ? getTime() - scenarioStartedAt : 0;
        const duration = wagon.duration || 10000;
        const progress = Math.min(1, Math.max(0, elapsed / duration));

        return {
            x: wagon.x,
            y: wagon.fromY + (wagon.toY - wagon.fromY) * progress
        };
    }

    function findBulletObstacleHit(
        allBullets: Record<string, BulletLike | null | undefined>,
        scenario: Scenario | null | undefined
    ) {
        let hit: {
            bullet: BulletLike;
            obstacleId: string | undefined;
        } | null = null;
        const bodies = getDamageableObstacleBodies(scenario);

        Object.keys(allBullets).forEach(function (bulletId) {
            const bullet = allBullets[bulletId];

            if (hit || !bullet || bullet.deleteMe) {
                return;
            }

            const bulletBox = bullet.getHitBox();

            bodies.forEach(function (body) {
                if (hit) {
                    return;
                }

                if (bulletBoxOverlapsBody(bulletBox, body)) {
                    hit = {
                        bullet,
                        obstacleId: body.id
                    };
                }
            });
        });

        return hit;
    }

    function bulletBoxOverlapsBody(box: Box, body: CircleBody | RectBody) {
        if (body.type === 'rect') {
            return Collision.boxesOverlap(box, body);
        }

        return boxOverlapsCircle(box, body);
    }

    function boxOverlapsCircle(box: Box, circle: CircleBody) {
        const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
        const closestY = Math.max(
            box.y,
            Math.min(circle.y, box.y + box.height)
        );
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;

        return dx * dx + dy * dy < circle.radius * circle.radius;
    }

    return {
        findBulletObstacleHit,
        getDamageableObstacleBodies,
        getObstacleBodies,
        getRockLines,
        getWagonPosition,
        render
    };
}
