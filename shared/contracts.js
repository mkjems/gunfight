// Shared data contracts and runtime guards for the TypeScript migration.

/**
 * @typedef {'waiting' | 'readying' | 'playing' | 'abandoned' | 'closed'} GameStatus
 */

/**
 * @typedef {'waiting' | 'ritual' | 'playing' | 'hitPause' | 'roundOver' | 'gameOver'} RoundState
 */

/**
 * @typedef {'lobby-main' | 'lobby-edit-name' | 'game' | 'high-scores'} ScreenName
 */

/**
 * @typedef {object} ClientScreenState
 * @property {RoundState} roundState
 * @property {boolean} nameEditorActive
 * @property {boolean} highScoresVisible
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
 * @typedef {object} Scenario
 * @property {RockInstance[]=} rocks
 * @property {CactusInstance[]=} cacti
 * @property {WagonInstance=} wagon
 * @property {Decoration[]=} decorations
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
