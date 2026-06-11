// Client-side JSDoc aliases while the browser app still runs as static scripts.
// Canonical runtime contracts and typedefs live in ../../shared/contracts.js.

/**
 * @typedef {import('../../shared/contracts.js').GameStatus} GameStatus
 * @typedef {import('../../shared/contracts.js').PublicClient} PublicClient
 * @typedef {import('../../shared/contracts.js').PublicGameModel} PublicGameModel
 * @typedef {import('../../shared/contracts.js').HighScoreEntry} HighScoreEntry
 * @typedef {import('../../shared/contracts.js').ScenarioSource} ScenarioSource
 * @typedef {import('../../shared/contracts.js').Scenario} Scenario
 * @typedef {import('../../shared/contracts.js').RockPlacement} RockPlacement
 * @typedef {import('../../shared/contracts.js').RockInstance} RockInstance
 * @typedef {import('../../shared/contracts.js').LineSegment} LineSegment
 * @typedef {import('../../shared/contracts.js').RockDefinition} RockDefinition
 * @typedef {import('../../shared/contracts.js').RockDefinitions} RockDefinitions
 * @typedef {import('../../shared/contracts.js').CactusInstance} CactusInstance
 * @typedef {import('../../shared/contracts.js').WagonInstance} WagonInstance
 * @typedef {import('../../shared/contracts.js').Decoration} Decoration
 * @typedef {import('../../shared/contracts.js').PlayerSnapshot} PlayerSnapshot
 * @typedef {import('../../shared/contracts.js').BulletSnapshot} BulletSnapshot
 * @typedef {import('../../shared/contracts.js').ClientKeyEventPayload} ClientKeyEventPayload
 * @typedef {import('../../shared/contracts.js').KeyEventPayload} KeyEventPayload
 * @typedef {import('../../shared/contracts.js').PlayerPositionInput} PlayerPositionInput
 * @typedef {import('../../shared/contracts.js').PlayerPositionPayload} PlayerPositionPayload
 * @typedef {import('../../shared/contracts.js').ObstacleDamagePayload} ObstacleDamagePayload
 * @typedef {import('../../shared/contracts.js').GameResultClient} GameResultClient
 * @typedef {import('../../shared/contracts.js').GameResultPayload} GameResultPayload
 * @typedef {import('../../shared/contracts.js').JoinedGamePayload} JoinedGamePayload
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
