// Shared client-side data contracts for the JavaScript-to-TypeScript migration.

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
 * @typedef {object} KeyEventPayload
 * @property {'down' | 'up'} action
 * @property {string} key
 * @property {number} player
 * @property {BulletSnapshot=} shot
 */

/**
 * @typedef {object} BulletSnapshot
 * @property {number} x
 * @property {number} y
 * @property {number} speedX
 * @property {number} speedY
 * @property {number} facing
 * @property {number} ownerId
 */

/**
 * @typedef {object} PlayerPositionPayload
 * @property {number} player
 * @property {number} x
 * @property {number} y
 * @property {number} frame
 * @property {number} aim
 * @property {number} facing
 */

/**
 * @typedef {object} ObstacleDamagePayload
 * @property {string} id
 * @property {number} ownerId
 * @property {number} roundNumber
 */
