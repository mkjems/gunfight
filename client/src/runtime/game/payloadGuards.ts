import type { Scenario } from '../../../../shared/contracts.js';
import type {
    ClientId,
    RuntimeClient,
    RuntimeGameModel,
    RuntimeJoinedGamePayload,
    RuntimeKeyEvent,
    RuntimeObstacleDamagePayload,
    RuntimePlayerPositionPayload
} from './types.js';

type RuntimeDataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RuntimeDataRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isClientId(value: unknown): value is ClientId {
    return typeof value === 'number' || typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function parseClient(data: unknown): RuntimeClient | null {
    if (!isRecord(data) || !isClientId(data.id) || !isFiniteNumber(data.slot)) {
        return null;
    }

    const client: RuntimeClient = {
        id: data.id,
        slot: data.slot
    };

    if (typeof data.name === 'string') {
        client.name = data.name;
    }

    if (typeof data.ready === 'boolean') {
        client.ready = data.ready;
    }

    return client;
}

export function parseGameModel(data: unknown): RuntimeGameModel | null {
    if (!isRecord(data) || !Array.isArray(data.clients)) {
        return null;
    }

    const clients: RuntimeClient[] = [];

    for (const clientData of data.clients) {
        const client = parseClient(clientData);

        if (!client) {
            return null;
        }

        clients.push(client);
    }

    const model: RuntimeGameModel = {
        clients
    };

    if (typeof data.gameId === 'string') {
        model.gameId = data.gameId;
    }

    if (typeof data.message === 'string') {
        model.message = data.message;
    }

    if (typeof data.matchResultId === 'string') {
        model.matchResultId = data.matchResultId;
    }

    if (typeof data.matchState === 'string') {
        model.matchState = data.matchState;
    }

    if (isFiniteNumber(data.playerLimit)) {
        model.playerLimit = data.playerLimit;
    }

    if (isFiniteNumber(data.roundNumber)) {
        model.roundNumber = data.roundNumber;
    }

    if (
        Array.isArray(data.scores) &&
        data.scores.every(function (score) {
            return isFiniteNumber(score);
        })
    ) {
        model.scores = data.scores.slice();
    }

    if (typeof data.status === 'string') {
        model.status = data.status;
    }

    if (data.currentScenario === null) {
        model.currentScenario = null;
    } else if (isRecord(data.currentScenario)) {
        model.currentScenario = data.currentScenario as Scenario;
    }

    return model;
}

export function parseJoinedGamePayload(
    data: unknown
): RuntimeJoinedGamePayload | null {
    if (!isRecord(data) || !isClientId(data.playerId)) {
        return null;
    }

    const model = parseGameModel(data.model);

    if (!model) {
        return null;
    }

    return {
        model,
        playerId: data.playerId
    };
}

export function parseKeyEvent(data: unknown): RuntimeKeyEvent | null {
    if (
        !isRecord(data) ||
        typeof data.action !== 'string' ||
        typeof data.key !== 'string'
    ) {
        return null;
    }

    const keyEvent: RuntimeKeyEvent = {
        action: data.action,
        key: data.key
    };

    if (isClientId(data.player)) {
        keyEvent.player = data.player;
    }

    if (data.shot !== undefined) {
        keyEvent.shot = data.shot;
    }

    return keyEvent;
}

export function parsePlayerPositionPayload(
    data: unknown
): RuntimePlayerPositionPayload | null {
    if (
        !isRecord(data) ||
        !isClientId(data.player) ||
        !isFiniteNumber(data.aim) ||
        !isFiniteNumber(data.facing) ||
        !isFiniteNumber(data.frame) ||
        !isFiniteNumber(data.x) ||
        !isFiniteNumber(data.y)
    ) {
        return null;
    }

    return {
        aim: data.aim,
        facing: data.facing,
        frame: data.frame,
        player: data.player,
        x: data.x,
        y: data.y
    };
}

export function parseObstacleDamagePayload(
    data: unknown
): RuntimeObstacleDamagePayload | null {
    if (!isRecord(data) || typeof data.id !== 'string') {
        return null;
    }

    if (!isClientId(data.ownerId)) {
        return null;
    }

    const payload: RuntimeObstacleDamagePayload = {
        id: data.id,
        ownerId: data.ownerId
    };

    if (isFiniteNumber(data.roundNumber)) {
        payload.roundNumber = data.roundNumber;
    }

    return payload;
}
