// Shared data contracts and runtime guards for the TypeScript migration.

export const MATCH_STATE = {
    Idle: 'idle',
    Playing: 'playing',
    GameOver: 'gameOver'
} as const;

export type MatchState = (typeof MATCH_STATE)[keyof typeof MATCH_STATE];

export const MATCH_STATE_VALUES: readonly MatchState[] =
    Object.values(MATCH_STATE);

export function isMatchState(value: unknown): value is MatchState {
    return MATCH_STATE_VALUES.includes(value as MatchState);
}

export const GAME_PHASE = {
    Waiting: 'waiting',
    Readying: 'readying',
    ReadyCountdown: 'readyCountdown',
    DuelIntro: 'duelIntro',
    Playing: 'playing',
    HitPause: 'hitPause',
    GameOver: 'gameOver',
    Abandoned: 'abandoned',
    Closed: 'closed'
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

export const GAME_PHASE_VALUES: readonly GamePhase[] =
    Object.values(GAME_PHASE);

export function isGamePhase(value: unknown): value is GamePhase {
    return GAME_PHASE_VALUES.includes(value as GamePhase);
}

export const SOCKET_EVENT = {
    ClientReady: 'clientReady',
    DuelResult: 'duelResult',
    Requeue: 'requeue',
    LeaveGame: 'leaveGame',
    LeftGame: 'leftGame',
    JoinLobby: 'joinLobby',
    UpdateName: 'updateName',
    ClientKeyEvent: 'clientKeyEvent',
    KeyEvent: 'keyEvent',
    PlayerPosition: 'playerPosition',
    ObstacleDamage: 'obstacleDamage',
    JoinedGame: 'joinedGame',
    NewClient: 'newClient',
    ModelUpdate: 'modelUpdate',
    HighScores: 'highScores',
    GameResult: 'gameResult'
} as const;

export type SocketEvent = (typeof SOCKET_EVENT)[keyof typeof SOCKET_EVENT];

export const SOCKET_EVENT_VALUES: readonly SocketEvent[] =
    Object.values(SOCKET_EVENT);

export function isSocketEvent(value: unknown): value is SocketEvent {
    return SOCKET_EVENT_VALUES.includes(value as SocketEvent);
}

export interface PublicClient {
    id: number;
    name: string;
    ready: boolean;
    slot: number;
}

export interface PublicGameModel {
    gameId: string;
    message: string;
    playerLimit: number;
    clients: PublicClient[];
    currentScenario: Scenario | null;
    matchResultId?: string;
    matchState: MatchState;
    matchEndsAt?: number;
    phase: GamePhase;
    phaseEndsAt?: number;
    phaseStartedAt: number;
    duelNumber: number;
    scores: number[];
    version: number;
}

export interface HighScoreEntry {
    name: string;
    wins: number;
    kills: number;
    deaths: number;
}

export interface ScenarioSource {
    name?: string;
    playerStarts?: PlayerStart[];
    rocks?: RockPlacement[];
    cacti?: CactusInstance[];
    moneyBags?: MoneyBagInstance[];
    wagon?: WagonInstance;
    decorations?: Decoration[];
}

export interface Scenario {
    name?: string;
    playerStarts?: PlayerStart[];
    rocks?: RockInstance[];
    cacti?: CactusInstance[];
    moneyBags?: MoneyBagInstance[];
    wagon?: WagonInstance;
    decorations?: Decoration[];
}

export interface RockPlacement {
    type: string;
    x: number;
    y: number;
}

export interface RockInstance {
    type: string;
    x: number;
    y: number;
    lines: LineSegment[];
}

export interface LineSegment {
    from: [number, number];
    to: [number, number];
}

export interface RockDefinition {
    lines: LineSegment[];
}

export type RockDefinitions = Record<string, RockDefinition>;

export interface PlayerStart {
    x: number;
    y: number;
    facing: number;
    frame: number;
}

export interface CactusInstance {
    x: number;
    y: number;
}

export interface MoneyBagInstance {
    x: number;
    y: number;
    gameRoundSeconds: number;
}

export interface WagonInstance {
    x: number;
    fromY: number;
    toY: number;
    duration?: number;
}

export interface Decoration {
    type: string;
    x: number;
    y: number;
}

export interface PlayerSnapshot {
    playerId: number;
    x: number;
    y: number;
    frame: number;
    aim: number;
    facing: number;
    slot: number;
}

export interface GameModelClient {
    id: number;
    ready: boolean;
}

export interface GameModelSnapshot {
    clients: GameModelClient[];
    currentScenario: Scenario | null;
    matchResultId?: string;
    matchState: MatchState;
    matchEndsAt?: number;
    phase: GamePhase;
    phaseEndsAt?: number;
    phaseStartedAt: number;
    duelNumber: number;
    scores: number[];
    version: number;
}

export interface BulletSnapshot {
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    facing: number;
    aim: number;
    width: number;
    height: number;
    straightness: number;
    altitude: number;
    altitudeVelocity: number;
    hasRicocheted?: boolean;
    isResting: boolean;
    isHarmful: boolean;
}

export interface ClientKeyEventPayload {
    action: 'down' | 'up';
    key: string;
    shot?: BulletSnapshot;
}

export type KeyEventPayload = ClientKeyEventPayload & { player: number };

export interface PlayerPositionInput {
    x: number;
    y: number;
    frame: number;
    aim: number;
    facing: number;
}

export type PlayerPositionPayload = PlayerPositionInput & { player: number };

export interface ObstacleDamagePayload {
    id: string;
    ownerId: number;
    duelNumber: number;
}

export interface DuelResultPayload {
    duelNumber: number;
    targetId: number;
    winnerId: number;
}

export interface GameResultClient {
    name: string;
    slot: number;
}

export interface GameResultPayload {
    resultId: string;
    gameId?: string;
    duelNumber?: number;
    clients: GameResultClient[];
    scores: number[];
}

export interface JoinedGamePayload {
    gameId: string;
    name: string;
    playerId: number;
    slot: number;
    model: PublicGameModel;
}

type DataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is DataRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

function isKeyAction(value: unknown): value is 'down' | 'up' {
    return value === 'down' || value === 'up';
}

function getFiniteNumber(record: DataRecord, key: string): number | null {
    const value = record[key];

    return isFiniteNumber(value) ? value : null;
}

function getOptionalBoolean(
    record: DataRecord,
    key: string,
    defaultValue: boolean
): boolean | null {
    const value = record[key];

    if (value === undefined) {
        return defaultValue;
    }

    return typeof value === 'boolean' ? value : null;
}

function getFiniteNumberOrNumericString(
    record: DataRecord,
    key: string
): number | null {
    const value = record[key];

    if (isFiniteNumber(value)) {
        return value;
    }

    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    const parsed = Number(value);

    return isFiniteNumber(parsed) ? parsed : null;
}

function copyNumberArray(value: unknown): number[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    if (!value.every(isFiniteNumber)) {
        return null;
    }

    return value.slice();
}

function createContentValidationError(
    sourceName: string,
    detail: string
): Error {
    return new Error(sourceName + ': ' + detail);
}

function requireRecord(value: unknown, sourceName: string): DataRecord {
    if (!isRecord(value)) {
        throw createContentValidationError(sourceName, 'expected an object');
    }

    return value;
}

function requireArray(value: unknown, sourceName: string): unknown[] {
    if (!Array.isArray(value)) {
        throw createContentValidationError(sourceName, 'expected an array');
    }

    return value;
}

function requireNumber(
    record: DataRecord,
    key: string,
    sourceName: string
): number {
    const value = getFiniteNumber(record, key);

    if (value === null) {
        throw createContentValidationError(
            sourceName + '.' + key,
            'expected a finite number'
        );
    }

    return value;
}

function requireString(
    record: DataRecord,
    key: string,
    sourceName: string
): string {
    const value = record[key];

    if (typeof value !== 'string' || value.length === 0) {
        throw createContentValidationError(
            sourceName + '.' + key,
            'expected a non-empty string'
        );
    }

    return value;
}

function optionalString(
    record: DataRecord,
    key: string,
    sourceName: string
): string | undefined {
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

function parsePoint(value: unknown, sourceName: string): [number, number] {
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

function parseLineSegment(value: unknown, sourceName: string): LineSegment {
    const line = requireRecord(value, sourceName);

    return {
        from: parsePoint(line.from, sourceName + '.from'),
        to: parsePoint(line.to, sourceName + '.to')
    };
}

function parseLineSegments(value: unknown, sourceName: string): LineSegment[] {
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

function parseRockDefinition(
    value: unknown,
    sourceName: string
): RockDefinition {
    const definition = requireRecord(value, sourceName);

    return {
        lines: parseLineSegments(definition.lines, sourceName + '.lines')
    };
}

function parseOptionalArray<T>(
    record: DataRecord,
    key: string,
    sourceName: string,
    parseItem: (item: unknown, sourceName: string) => T
): T[] | undefined {
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

function parseCactusInstance(
    value: unknown,
    sourceName: string
): CactusInstance {
    const cactus = requireRecord(value, sourceName);

    return {
        x: requireNumber(cactus, 'x', sourceName),
        y: requireNumber(cactus, 'y', sourceName)
    };
}

function parseMoneyBagInstance(
    value: unknown,
    sourceName: string
): MoneyBagInstance {
    const moneyBag = requireRecord(value, sourceName);
    const gameRoundSeconds = requireNumber(
        moneyBag,
        'gameRoundSeconds',
        sourceName
    );

    if (gameRoundSeconds < 0) {
        throw createContentValidationError(
            sourceName + '.gameRoundSeconds',
            'expected a non-negative number'
        );
    }

    return {
        x: requireNumber(moneyBag, 'x', sourceName),
        y: requireNumber(moneyBag, 'y', sourceName),
        gameRoundSeconds
    };
}

function parsePlayerStart(value: unknown, sourceName: string): PlayerStart {
    const start = requireRecord(value, sourceName);

    return {
        x: requireNumber(start, 'x', sourceName),
        y: requireNumber(start, 'y', sourceName),
        facing: requireNumber(start, 'facing', sourceName),
        frame: requireNumber(start, 'frame', sourceName)
    };
}

function parseDecoration(value: unknown, sourceName: string): Decoration {
    const decoration = requireRecord(value, sourceName);

    return {
        type: requireString(decoration, 'type', sourceName),
        x: requireNumber(decoration, 'x', sourceName),
        y: requireNumber(decoration, 'y', sourceName)
    };
}

function parseWagon(value: unknown, sourceName: string): WagonInstance {
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

function parseRockPlacement(
    value: unknown,
    rockDefinitions: RockDefinitions,
    sourceName: string
): RockPlacement {
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

function copyLineSegment(line: LineSegment): LineSegment {
    return {
        from: [line.from[0], line.from[1]],
        to: [line.to[0], line.to[1]]
    };
}

export function parseRockDefinitions(
    data: unknown,
    sourceName?: string
): RockDefinitions {
    const label = sourceName || 'rock definitions';
    const definitions = requireRecord(data, label);
    const entries = Object.entries(definitions);
    const parsed: RockDefinitions = {};

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

export function parseScenarioSources(
    data: unknown,
    rockDefinitions: RockDefinitions,
    sourceName?: string
): ScenarioSource[] {
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
            ...(record.playerStarts === undefined
                ? {}
                : {
                      playerStarts: parseOptionalArray(
                          record,
                          'playerStarts',
                          scenarioLabel,
                          parsePlayerStart
                      )
                  }),
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
            moneyBags: parseOptionalArray(
                record,
                'moneyBags',
                scenarioLabel,
                parseMoneyBagInstance
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

export function resolveScenarioSource(
    scenario: ScenarioSource,
    rockDefinitions: RockDefinitions
): Scenario {
    return {
        name: scenario.name,
        ...(scenario.playerStarts
            ? {
                  playerStarts: scenario.playerStarts.map(function (start) {
                      return { ...start };
                  })
              }
            : {}),
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
        moneyBags: scenario.moneyBags
            ? scenario.moneyBags.map(function (moneyBag) {
                  return { ...moneyBag };
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

export function getNameFromPayload(data: unknown): unknown {
    if (typeof data === 'string') {
        return data;
    }

    if (isRecord(data)) {
        return data.name;
    }

    return undefined;
}

export function shouldRejoinAfterLeave(data: unknown): boolean {
    return isRecord(data) && data.rejoin === true;
}

export function normalizeBulletSnapshot(data: unknown): BulletSnapshot | null {
    if (!isRecord(data)) {
        return null;
    }

    const aim = getFiniteNumber(data, 'aim');
    const altitude = getFiniteNumber(data, 'altitude');
    const altitudeVelocity = getFiniteNumber(data, 'altitudeVelocity');
    const facing = getFiniteNumber(data, 'facing');
    const hasRicocheted = getOptionalBoolean(data, 'hasRicocheted', false);
    const height = getFiniteNumber(data, 'height');
    const isHarmful =
        typeof data.isHarmful === 'boolean' ? data.isHarmful : null;
    const isResting =
        typeof data.isResting === 'boolean' ? data.isResting : null;
    const speedX = getFiniteNumber(data, 'speedX');
    const speedY = getFiniteNumber(data, 'speedY');
    const straightness = getFiniteNumber(data, 'straightness');
    const width = getFiniteNumber(data, 'width');
    const x = getFiniteNumber(data, 'x');
    const y = getFiniteNumber(data, 'y');

    if (
        aim === null ||
        altitude === null ||
        altitudeVelocity === null ||
        facing === null ||
        hasRicocheted === null ||
        height === null ||
        isHarmful === null ||
        isResting === null ||
        speedX === null ||
        speedY === null ||
        straightness === null ||
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
        straightness: Math.max(0, Math.min(1, straightness)),
        altitude: altitude,
        altitudeVelocity: altitudeVelocity,
        hasRicocheted: hasRicocheted,
        isResting: isResting,
        isHarmful: isHarmful
    };
}

export function normalizeClientKeyEventPayload(
    data: unknown
): ClientKeyEventPayload | null {
    if (
        !isRecord(data) ||
        typeof data.key !== 'string' ||
        !isKeyAction(data.action)
    ) {
        return null;
    }

    const payload: ClientKeyEventPayload = {
        action: data.action,
        key: data.key
    };

    if (data.shot !== undefined) {
        const shot = normalizeBulletSnapshot(data.shot);

        if (!shot) {
            return null;
        }

        payload.shot = shot;
    }

    return payload;
}

export function createKeyEventPayload(
    data: unknown,
    playerId: number
): KeyEventPayload | null {
    const payload = normalizeClientKeyEventPayload(data);

    if (!payload || !isFiniteNumber(playerId)) {
        return null;
    }

    return {
        ...payload,
        player: playerId
    };
}

export function normalizePlayerPositionInput(
    data: unknown
): PlayerPositionInput | null {
    if (!isRecord(data)) {
        return null;
    }

    const aim = getFiniteNumber(data, 'aim');
    const facing = getFiniteNumber(data, 'facing');
    const frame = getFiniteNumber(data, 'frame');
    const x = getFiniteNumber(data, 'x');
    const y = getFiniteNumber(data, 'y');

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

export function createPlayerPositionPayload(
    data: unknown,
    playerId: number
): PlayerPositionPayload | null {
    const payload = normalizePlayerPositionInput(data);

    if (!payload || !isFiniteNumber(playerId)) {
        return null;
    }

    return {
        ...payload,
        player: playerId
    };
}

export function normalizeObstacleDamagePayload(
    data: unknown
): ObstacleDamagePayload | null {
    if (!isRecord(data) || !isNonEmptyString(data.id)) {
        return null;
    }

    const ownerId = getFiniteNumber(data, 'ownerId');
    const duelNumber = getFiniteNumber(data, 'duelNumber');

    if (ownerId === null || duelNumber === null) {
        return null;
    }

    return {
        id: data.id,
        ownerId: ownerId,
        duelNumber: duelNumber
    };
}

export function normalizeDuelResultPayload(
    data: unknown
): DuelResultPayload | null {
    if (!isRecord(data)) {
        return null;
    }

    const duelNumber = getFiniteNumber(data, 'duelNumber');
    const targetId = getFiniteNumberOrNumericString(data, 'targetId');
    const winnerId = getFiniteNumberOrNumericString(data, 'winnerId');

    if (duelNumber === null || targetId === null || winnerId === null) {
        return null;
    }

    return {
        duelNumber: duelNumber,
        targetId: targetId,
        winnerId: winnerId
    };
}

function normalizeGameResultClient(data: unknown): GameResultClient | null {
    if (!isRecord(data) || typeof data.name !== 'string') {
        return null;
    }

    const slot = getFiniteNumber(data, 'slot');

    if (slot === null) {
        return null;
    }

    return {
        name: data.name,
        slot: slot
    };
}

export function normalizeGameResultPayload(
    data: unknown
): GameResultPayload | null {
    if (
        !isRecord(data) ||
        !isNonEmptyString(data.resultId) ||
        !Array.isArray(data.clients)
    ) {
        return null;
    }

    const clients: GameResultClient[] = [];

    for (const clientData of data.clients) {
        const client = normalizeGameResultClient(clientData);

        if (!client) {
            return null;
        }

        clients.push(client);
    }

    const scores = copyNumberArray(data.scores);
    const duelNumber = getFiniteNumber(data, 'duelNumber');

    if (!scores) {
        return null;
    }

    return {
        resultId: data.resultId,
        gameId: typeof data.gameId === 'string' ? data.gameId : undefined,
        duelNumber: duelNumber === null ? undefined : duelNumber,
        clients: clients,
        scores: scores
    };
}
