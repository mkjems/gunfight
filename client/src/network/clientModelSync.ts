type ClientId = number | string;

type ModelClient = {
    id: ClientId;
    name?: string;
    ready?: boolean;
    slot?: number;
};

type PublicModel = {
    clients: ModelClient[];
    status?: string;
};

export function getLocalClient(
    model?: PublicModel | null,
    playerId?: ClientId | null
): ModelClient | null {
    if (!model) {
        return null;
    }

    return (
        (model.clients || []).find(function (client) {
            return client.id === playerId;
        }) || null
    );
}

function shouldClearLocalReadyRequest(
    model?: PublicModel | null,
    playerId?: ClientId | null
): boolean {
    const client = getLocalClient(model, playerId);

    return !!(client && !client.ready);
}

function didAnyClientBecomeReady(
    previousModel?: PublicModel | null,
    model?: PublicModel | null
): boolean {
    const previousReady: Record<ClientId, boolean | undefined> = {};

    if (!previousModel || !model) {
        return false;
    }

    (previousModel.clients || []).forEach(function (client) {
        previousReady[client.id] = client.ready;
    });

    return (model.clients || []).some(function (client) {
        return !!client.ready && !previousReady[client.id];
    });
}

export function analyze(
    previousModel: PublicModel | null,
    model: PublicModel | null,
    playerId?: ClientId | null
) {
    return {
        abandoned: model && model.status === 'abandoned',
        clearLocalReadyRequest: shouldClearLocalReadyRequest(model, playerId),
        clientBecameReady: didAnyClientBecomeReady(previousModel, model)
    };
}

export const ClientModelSync = {
    analyze,
    getLocalClient
};
