GF.ScenarioRenderer = function (options) {
    options = options || {};

    var context = options.context;
    var getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    var getObstacleDamage =
        options.getObstacleDamage ||
        function () {
            return 0;
        };
    var getScenarioStartedAt =
        options.getScenarioStartedAt ||
        function () {
            return null;
        };
    var getRockPattern =
        options.getRockPattern ||
        function () {
            return null;
        };
    var sprites = options.sprites || {};

    function render(scenario) {
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

    function drawDecorations(scenario) {
        (scenario.decorations || []).forEach(function (decoration) {
            if (decoration.type === 'saloon') {
                drawSaloon(decoration.x, decoration.y);
            }
        });
    }

    function drawSaloon(x, y) {
        var scale = GF.Config.graphics.scale;
        var width = 64 * scale;
        var height = 128 * scale;
        var saloonSprite = sprites.saloon;

        if (!saloonSprite || !saloonSprite.complete) {
            return;
        }

        context.drawImage(saloonSprite, x, y, width, height);
    }

    function drawRocks(scenario) {
        (scenario.rocks || []).forEach(function (rock) {
            var lines = rock.lines || [];
            var firstLine = lines[0];

            if (!firstLine) {
                return;
            }

            context.save();
            context.fillStyle = getRockPattern() || GF.Config.colors.yellow;
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

    function getRockLines(scenario) {
        var lines = [];

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

    function getObstacleBodies(scenario) {
        var bodies = [];

        if (!scenario) {
            return bodies;
        }

        (scenario.cacti || []).forEach(function (cactus, index) {
            var body = getCactusBody(cactus, index);

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

    function getDamageableObstacleBodies(scenario) {
        var bodies = [];

        if (!scenario) {
            return bodies;
        }

        (scenario.cacti || []).forEach(function (cactus, index) {
            var body = getCactusBody(cactus, index);

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

    function getRockPolygonBody(rock) {
        return {
            type: 'polygon',
            points: getRockPolygonPoints(rock)
        };
    }

    function getRockPolygonPoints(rock) {
        return (rock.lines || []).map(function (line) {
            return {
                x: rock.x + line.from[0],
                y: rock.y + line.from[1]
            };
        });
    }

    function getWagonObstacleCircles(wagon) {
        var position = getWagonPosition(wagon);
        var scale = GF.Config.graphics.scale;
        var colliders = [
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

    function getCactusBody(cactus, index) {
        var scale = GF.Config.graphics.scale;
        var damage = getCactusDamageStage(index);
        var width = 5 * scale;
        var heights = [29, 22, 15, 0];
        var height = heights[damage] * scale;

        if (!height) {
            return null;
        }

        return {
            type: 'rect',
            id: getCactusId(index),
            damage: damage,
            x: cactus.x - width / 2,
            y: cactus.y - height,
            width: width,
            height: height
        };
    }

    function getCactusId(index) {
        return 'cactus:' + index;
    }

    function getCactusDamageStage(index) {
        return Math.min(3, getObstacleDamage(getCactusId(index)));
    }

    function drawCactus(x, y, damage) {
        var scale = GF.Config.graphics.scale;
        var sourceWidth = 17;
        var sourceHeight = 32;
        var frame = Math.min(3, damage);
        var width = sourceWidth * scale;
        var height = sourceHeight * scale;
        var cactusSprite = sprites.cactus;

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
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(x - width / 2, y - height, width, height);
        }

        context.restore();
    }

    function drawWagon(wagon) {
        var position = getWagonPosition(wagon);
        var scale = GF.Config.graphics.scale;
        var sourceWidth = 37;
        var sourceHeight = 38;
        var damage = Math.min(3, getObstacleDamage('wagon'));
        var width = sourceWidth * scale;
        var height = sourceHeight * scale;
        var wagonSprite = sprites.wagon;

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
            context.fillStyle = GF.Config.colors.yellow;
            context.fillRect(
                position.x - width / 2,
                position.y - height / 2,
                width,
                height
            );
        }

        context.restore();
    }

    function getWagonPosition(wagon) {
        var scenarioStartedAt = getScenarioStartedAt();
        var elapsed = scenarioStartedAt ? getTime() - scenarioStartedAt : 0;
        var duration = wagon.duration || 10000;
        var progress = Math.min(1, Math.max(0, elapsed / duration));

        return {
            x: wagon.x,
            y: wagon.fromY + (wagon.toY - wagon.fromY) * progress
        };
    }

    function findBulletObstacleHit(allBullets, scenario) {
        var hit = null;
        var bodies = getDamageableObstacleBodies(scenario);

        Object.keys(allBullets).forEach(function (bulletId) {
            var bullet = allBullets[bulletId];
            var bulletBox;

            if (hit || !bullet || bullet.deleteMe) {
                return;
            }

            bulletBox = bullet.getHitBox();

            bodies.forEach(function (body) {
                if (hit) {
                    return;
                }

                if (bulletBoxOverlapsBody(bulletBox, body)) {
                    hit = {
                        bullet: bullet,
                        obstacleId: body.id
                    };
                }
            });
        });

        return hit;
    }

    function bulletBoxOverlapsBody(box, body) {
        if (body.type === 'rect') {
            return GF.Collision.boxesOverlap(box, body);
        }

        return boxOverlapsCircle(box, body);
    }

    function boxOverlapsCircle(box, circle) {
        var closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
        var closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
        var dx = circle.x - closestX;
        var dy = circle.y - closestY;

        return dx * dx + dy * dy < circle.radius * circle.radius;
    }

    return {
        findBulletObstacleHit: findBulletObstacleHit,
        getDamageableObstacleBodies: getDamageableObstacleBodies,
        getObstacleBodies: getObstacleBodies,
        getRockLines: getRockLines,
        getWagonPosition: getWagonPosition,
        render: render
    };
};
