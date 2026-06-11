// Shared data contracts and runtime guards for the TypeScript migration.

/**
 * @typedef {'waiting' | 'readying' | 'playing' | 'abandoned' | 'closed'} GameStatus
 */

/**
 * @typedef {object} PublicClient
 * @property {number} id
 * @property {string} name
 * @property {boolean} ready
 * @property {number} slot
 */

/**
 * @typedef {object} PublicGameModel
 * @property {string} gameId
 * @property {GameStatus} status
 * @property {string} message
 * @property {number} playerLimit
 * @property {PublicClient[]} clients
 * @property {Scenario | null} currentScenario
 * @property {number} roundNumber
 */

/**
 * @typedef {object} HighScoreEntry
 * @property {string} name
 * @property {number} wins
 * @property {number} kills
 * @property {number} deaths
 */

/**
 * Source JSON scenario before rock definitions are resolved.
 *
 * @typedef {object} ScenarioSource
 * @property {string=} name
 * @property {RockPlacement[]=} rocks
 * @property {CactusInstance[]=} cacti
 * @property {WagonInstance=} wagon
 * @property {Decoration[]=} decorations
 */

/**
 * Resolved runtime scenario sent in public game models.
 *
 * @typedef {object} Scenario
 * @property {string=} name
 * @property {RockInstance[]=} rocks
 * @property {CactusInstance[]=} cacti
 * @property {WagonInstance=} wagon
 * @property {Decoration[]=} decorations
 */

/**
 * @typedef {object} RockPlacement
 * @property {string} type
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} RockInstance
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {LineSegment[]} lines
 */

/**
 * @typedef {object} LineSegment
 * @property {[number, number]} from
 * @property {[number, number]} to
 */

/**
 * @typedef {object} RockDefinition
 * @property {LineSegment[]} lines
 */

/**
 * @typedef {Record<string, RockDefinition>} RockDefinitions
 */

/**
 * @typedef {object} CactusInstance
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} WagonInstance
 * @property {number} x
 * @property {number} fromY
 * @property {number} toY
 * @property {number=} duration
 */

/**
 * @typedef {object} Decoration
 * @property {string} type
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} PlayerSnapshot
 * @property {number} playerId
 * @property {number} x
 * @property {number} y
 * @property {number} frame
 * @property {number} aim
 * @property {number} facing
 * @property {number} slot
 */

/**
 * @typedef {object} GameModelClient
 * @property {number} id
 * @property {boolean} ready
 */

/**
 * @typedef {object} GameModelSnapshot
 * @property {GameModelClient[]} clients
 * @property {Scenario | null} currentScenario
 * @property {number} roundNumber
 */

/**
 * @typedef {object} BulletSnapshot
 * @property {number} x
 * @property {number} y
 * @property {number} speedX
 * @property {number} speedY
 * @property {number} facing
 * @property {number} aim
 * @property {number} width
 * @property {number} height
 * @property {boolean=} hasRicocheted
 */

/**
 * @typedef {object} ClientKeyEventPayload
 * @property {'down' | 'up'} action
 * @property {string} key
 * @property {BulletSnapshot=} shot
 */

/**
 * @typedef {ClientKeyEventPayload & { player: number }} KeyEventPayload
 */

/**
 * @typedef {object} PlayerPositionInput
 * @property {number} x
 * @property {number} y
 * @property {number} frame
 * @property {number} aim
 * @property {number} facing
 */

/**
 * @typedef {PlayerPositionInput & { player: number }} PlayerPositionPayload
 */

/**
 * @typedef {object} ObstacleDamagePayload
 * @property {string} id
 * @property {number} ownerId
 * @property {number} roundNumber
 */

/**
 * @typedef {object} GameResultClient
 * @property {string} name
 * @property {number} slot
 */

/**
 * @typedef {object} GameResultPayload
 * @property {string} resultId
 * @property {string=} gameId
 * @property {number=} roundNumber
 * @property {GameResultClient[]} clients
 * @property {number[]} scores
 */

/**
 * @typedef {object} JoinedGamePayload
 * @property {string} gameId
 * @property {string} name
 * @property {number} playerId
 * @property {number} slot
 * @property {PublicGameModel} model
 */

/**
 * @typedef {Record<string, unknown>} DataRecord
 */

/**
 * @param {unknown} value
 * @returns {value is DataRecord}
 */
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}

/**
 * @param {unknown} value
 * @returns {value is 'down' | 'up'}
 */
function isKeyAction(value) {
    return value === 'down' || value === 'up';
}

/**
 * @param {DataRecord} record
 * @param {string} key
 * @returns {number | null}
 */
function getFiniteNumber(record, key) {
    const value = record[key];

    return isFiniteNumber(value) ? value : null;
}

/**
 * @param {unknown} value
 * @returns {number[] | null}
 */
function copyNumberArray(value) {
    if (!Array.isArray(value)) {
        return null;
    }

    if (
        !value.every(function (item) {
            return isFiniteNumber(item);
        })
    ) {
        return null;
    }

    return value.slice();
}

/**
 * @param {string} sourceName
 * @param {string} detail
 * @returns {Error}
 */
function createContentValidationError(sourceName, detail) {
    return new Error(sourceName + ': ' + detail);
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {DataRecord}
 */
function requireRecord(value, sourceName) {
    if (!isRecord(value)) {
        throw createContentValidationError(sourceName, 'expected an object');
    }

    return value;
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {unknown[]}
 */
function requireArray(value, sourceName) {
    if (!Array.isArray(value)) {
        throw createContentValidationError(sourceName, 'expected an array');
    }

    return value;
}

/**
 * @param {DataRecord} record
 * @param {string} key
 * @param {string} sourceName
 * @returns {number}
 */
function requireNumber(record, key, sourceName) {
    const value = getFiniteNumber(record, key);

    if (value === null) {
        throw createContentValidationError(
            sourceName + '.' + key,
            'expected a finite number'
        );
    }

    return value;
}

/**
 * @param {DataRecord} record
 * @param {string} key
 * @param {string} sourceName
 * @returns {string}
 */
function requireString(record, key, sourceName) {
    const value = record[key];

    if (typeof value !== 'string' || value.length === 0) {
        throw createContentValidationError(
            sourceName + '.' + key,
            'expected a non-empty string'
        );
    }

    return value;
}

/**
 * @param {DataRecord} record
 * @param {string} key
 * @param {string} sourceName
 * @returns {string | undefined}
 */
function optionalString(record, key, sourceName) {
    const value = record[key];

    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw createContentValidationError(
            sourceName + '.' + key,
            'expected a string'
        );
    }

    return value;
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {[number, number]}
 */
function parsePoint(value, sourceName) {
    if (
        !Array.isArray(value) ||
        value.length !== 2 ||
        !isFiniteNumber(value[0]) ||
        !isFiniteNumber(value[1])
    ) {
        throw createContentValidationError(
            sourceName,
            'expected [number, number]'
        );
    }

    return [value[0], value[1]];
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {LineSegment}
 */
function parseLineSegment(value, sourceName) {
    const line = requireRecord(value, sourceName);

    return {
        from: parsePoint(line.from, sourceName + '.from'),
        to: parsePoint(line.to, sourceName + '.to')
    };
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {LineSegment[]}
 */
function parseLineSegments(value, sourceName) {
    const lines = requireArray(value, sourceName);

    if (lines.length === 0) {
        throw createContentValidationError(
            sourceName,
            'expected at least one line segment'
        );
    }

    return lines.map(function (line, index) {
        return parseLineSegment(line, sourceName + '[' + index + ']');
    });
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {RockDefinition}
 */
function parseRockDefinition(value, sourceName) {
    const definition = requireRecord(value, sourceName);

    return {
        lines: parseLineSegments(definition.lines, sourceName + '.lines')
    };
}

/**
 * @template T
 * @param {DataRecord} record
 * @param {string} key
 * @param {string} sourceName
 * @param {(item: unknown, sourceName: string) => T} parseItem
 * @returns {T[] | undefined}
 */
function parseOptionalArray(record, key, sourceName, parseItem) {
    const value = record[key];

    if (value === undefined) {
        return undefined;
    }

    return requireArray(value, sourceName + '.' + key).map(
        function (item, index) {
            return parseItem(item, sourceName + '.' + key + '[' + index + ']');
        }
    );
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {CactusInstance}
 */
function parseCactusInstance(value, sourceName) {
    const cactus = requireRecord(value, sourceName);

    return {
        x: requireNumber(cactus, 'x', sourceName),
        y: requireNumber(cactus, 'y', sourceName)
    };
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {Decoration}
 */
function parseDecoration(value, sourceName) {
    const decoration = requireRecord(value, sourceName);

    return {
        type: requireString(decoration, 'type', sourceName),
        x: requireNumber(decoration, 'x', sourceName),
        y: requireNumber(decoration, 'y', sourceName)
    };
}

/**
 * @param {unknown} value
 * @param {string} sourceName
 * @returns {WagonInstance}
 */
function parseWagon(value, sourceName) {
    const wagon = requireRecord(value, sourceName);
    const duration = getFiniteNumber(wagon, 'duration');

    if (wagon.duration !== undefined && duration === null) {
        throw createContentValidationError(
            sourceName + '.duration',
            'expected a finite number'
        );
    }

    return {
        x: requireNumber(wagon, 'x', sourceName),
        fromY: requireNumber(wagon, 'fromY', sourceName),
        toY: requireNumber(wagon, 'toY', sourceName),
        duration: duration === null ? undefined : duration
    };
}

/**
 * @param {unknown} value
 * @param {RockDefinitions} rockDefinitions
 * @param {string} sourceName
 * @returns {RockPlacement}
 */
function parseRockPlacement(value, rockDefinitions, sourceName) {
    const rock = requireRecord(value, sourceName);
    const type = requireString(rock, 'type', sourceName);

    if (!rockDefinitions[type]) {
        throw createContentValidationError(
            sourceName + '.type',
            'unknown rock definition "' + type + '"'
        );
    }

    return {
        type: type,
        x: requireNumber(rock, 'x', sourceName),
        y: requireNumber(rock, 'y', sourceName)
    };
}

/**
 * @param {LineSegment} line
 * @returns {LineSegment}
 */
function copyLineSegment(line) {
    return {
        from: [line.from[0], line.from[1]],
        to: [line.to[0], line.to[1]]
    };
}

/**
 * @param {unknown} data
 * @param {string=} sourceName
 * @returns {RockDefinitions}
 */
export function parseRockDefinitions(data, sourceName) {
    const label = sourceName || 'rock definitions';
    const definitions = requireRecord(data, label);
    const entries = Object.entries(definitions);
    /** @type {RockDefinitions} */
    const parsed = {};

    if (entries.length === 0) {
        throw createContentValidationError(
            label,
            'expected at least one rock definition'
        );
    }

    entries.forEach(function ([type, definition]) {
        parsed[type] = parseRockDefinition(definition, label + '.' + type);
    });

    return parsed;
}

/**
 * @param {unknown} data
 * @param {RockDefinitions} rockDefinitions
 * @param {string=} sourceName
 * @returns {ScenarioSource[]}
 */
export function parseScenarioSources(data, rockDefinitions, sourceName) {
    const label = sourceName || 'scenarios';
    const scenarios = requireArray(data, label);

    return scenarios.map(function (scenario, index) {
        const scenarioLabel = label + '[' + index + ']';
        const record = requireRecord(scenario, scenarioLabel);
        const name = optionalString(record, 'name', scenarioLabel);
        const wagon =
            record.wagon === undefined
                ? undefined
                : parseWagon(record.wagon, scenarioLabel + '.wagon');

        return {
            name: name,
            decorations: parseOptionalArray(
                record,
                'decorations',
                scenarioLabel,
                parseDecoration
            ),
            cacti: parseOptionalArray(
                record,
                'cacti',
                scenarioLabel,
                parseCactusInstance
            ),
            rocks: parseOptionalArray(
                record,
                'rocks',
                scenarioLabel,
                function (rock, rockLabel) {
                    return parseRockPlacement(rock, rockDefinitions, rockLabel);
                }
            ),
            wagon: wagon
        };
    });
}

/**
 * @param {ScenarioSource} scenario
 * @param {RockDefinitions} rockDefinitions
 * @returns {Scenario}
 */
export function resolveScenarioSource(scenario, rockDefinitions) {
    return {
        name: scenario.name,
        decorations: scenario.decorations
            ? scenario.decorations.map(function (decoration) {
                  return { ...decoration };
              })
            : undefined,
        cacti: scenario.cacti
            ? scenario.cacti.map(function (cactus) {
                  return { ...cactus };
              })
            : undefined,
        rocks: (scenario.rocks || []).map(function (rock) {
            return {
                type: rock.type,
                x: rock.x,
                y: rock.y,
                lines: rockDefinitions[rock.type].lines.map(copyLineSegment)
            };
        }),
        wagon: scenario.wagon ? { ...scenario.wagon } : undefined
    };
}

/**
 * @param {unknown} data
 * @returns {unknown}
 */
export function getNameFromPayload(data) {
    if (typeof data === 'string') {
        return data;
    }

    if (isRecord(data)) {
        return data.name;
    }

    return undefined;
}

/**
 * @param {unknown} data
 * @returns {boolean}
 */
export function shouldRejoinAfterLeave(data) {
    return isRecord(data) && data.rejoin === true;
}

/**
 * @param {unknown} data
 * @returns {BulletSnapshot | null}
 */
export function normalizeBulletSnapshot(data) {
    let aim;
    let facing;
    let height;
    let speedX;
    let speedY;
    let width;
    let x;
    let y;

    if (
        !isRecord(data) ||
        (data.hasRicocheted !== undefined &&
            typeof data.hasRicocheted !== 'boolean')
    ) {
        return null;
    }

    aim = getFiniteNumber(data, 'aim');
    facing = getFiniteNumber(data, 'facing');
    height = getFiniteNumber(data, 'height');
    speedX = getFiniteNumber(data, 'speedX');
    speedY = getFiniteNumber(data, 'speedY');
    width = getFiniteNumber(data, 'width');
    x = getFiniteNumber(data, 'x');
    y = getFiniteNumber(data, 'y');

    if (
        aim === null ||
        facing === null ||
        height === null ||
        speedX === null ||
        speedY === null ||
        width === null ||
        x === null ||
        y === null
    ) {
        return null;
    }

    return {
        x: x,
        y: y,
        speedX: speedX,
        speedY: speedY,
        facing: facing,
        aim: aim,
        width: width,
        height: height,
        hasRicocheted: data.hasRicocheted === true
    };
}

/**
 * @param {unknown} data
 * @returns {ClientKeyEventPayload | null}
 */
export function normalizeClientKeyEventPayload(data) {
    /** @type {ClientKeyEventPayload} */
    const payload = {};
    let shot;

    if (
        !isRecord(data) ||
        typeof data.key !== 'string' ||
        !isKeyAction(data.action)
    ) {
        return null;
    }

    payload.action = data.action;
    payload.key = data.key;

    if (data.shot !== undefined) {
        shot = normalizeBulletSnapshot(data.shot);

        if (!shot) {
            return null;
        }

        payload.shot = shot;
    }

    return payload;
}

/**
 * @param {unknown} data
 * @param {number} playerId
 * @returns {KeyEventPayload | null}
 */
export function createKeyEventPayload(data, playerId) {
    const payload = normalizeClientKeyEventPayload(data);

    if (!payload || !isFiniteNumber(playerId)) {
        return null;
    }

    return {
        ...payload,
        player: playerId
    };
}

/**
 * @param {unknown} data
 * @returns {PlayerPositionInput | null}
 */
export function normalizePlayerPositionInput(data) {
    let aim;
    let facing;
    let frame;
    let x;
    let y;

    if (!isRecord(data)) {
        return null;
    }

    aim = getFiniteNumber(data, 'aim');
    facing = getFiniteNumber(data, 'facing');
    frame = getFiniteNumber(data, 'frame');
    x = getFiniteNumber(data, 'x');
    y = getFiniteNumber(data, 'y');

    if (
        aim === null ||
        facing === null ||
        frame === null ||
        x === null ||
        y === null
    ) {
        return null;
    }

    return {
        x: x,
        y: y,
        frame: frame,
        aim: aim,
        facing: facing
    };
}

/**
 * @param {unknown} data
 * @param {number} playerId
 * @returns {PlayerPositionPayload | null}
 */
export function createPlayerPositionPayload(data, playerId) {
    const payload = normalizePlayerPositionInput(data);

    if (!payload || !isFiniteNumber(playerId)) {
        return null;
    }

    return {
        ...payload,
        player: playerId
    };
}

/**
 * @param {unknown} data
 * @returns {ObstacleDamagePayload | null}
 */
export function normalizeObstacleDamagePayload(data) {
    let ownerId;
    let roundNumber;

    if (!isRecord(data) || !isNonEmptyString(data.id)) {
        return null;
    }

    ownerId = getFiniteNumber(data, 'ownerId');
    roundNumber = getFiniteNumber(data, 'roundNumber');

    if (ownerId === null || roundNumber === null) {
        return null;
    }

    return {
        id: data.id,
        ownerId: ownerId,
        roundNumber: roundNumber
    };
}

/**
 * @param {unknown} data
 * @returns {GameResultClient | null}
 */
function normalizeGameResultClient(data) {
    let slot;

    if (!isRecord(data) || typeof data.name !== 'string') {
        return null;
    }

    slot = getFiniteNumber(data, 'slot');

    if (slot === null) {
        return null;
    }

    return {
        name: data.name,
        slot: slot
    };
}

/**
 * @param {unknown} data
 * @returns {GameResultPayload | null}
 */
export function normalizeGameResultPayload(data) {
    /** @type {GameResultClient[]} */
    const clients = [];
    let roundNumber;
    let scores;

    if (
        !isRecord(data) ||
        !isNonEmptyString(data.resultId) ||
        !Array.isArray(data.clients)
    ) {
        return null;
    }

    for (const clientData of data.clients) {
        const client = normalizeGameResultClient(clientData);

        if (!client) {
            return null;
        }

        clients.push(client);
    }

    scores = copyNumberArray(data.scores);
    roundNumber = getFiniteNumber(data, 'roundNumber');

    if (!scores) {
        return null;
    }

    return {
        resultId: data.resultId,
        gameId: typeof data.gameId === 'string' ? data.gameId : undefined,
        roundNumber: roundNumber === null ? undefined : roundNumber,
        clients: clients,
        scores: scores
    };
}
