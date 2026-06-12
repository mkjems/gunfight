type ClientId = number | string;

type LobbyClient = {
    id: ClientId;
    name?: string;
    ready?: boolean;
    slot?: number;
};

type LobbyModel = {
    gameId?: string;
    status?: string;
    message?: string;
    playerLimit?: number;
    clients?: LobbyClient[];
};

type LobbyOptions = {
    localReadyRequested?: boolean;
    model?: LobbyModel | null;
    playerId?: ClientId | null;
};

type LobbyViewModelOptions = LobbyOptions & {
    isTouch?: boolean;
};

type HighScoresScreenOptions = {
    localReadyRequested?: boolean;
    model?: LobbyModel | null;
    now?: number;
};

type LobbySlotViewModel = {
    label: string;
    ready: boolean;
};

const controls = [
    'h j k l - left down up right',
    'a z - aim up down',
    'Space - shoot'
];

export function getClientName(client: LobbyClient): string {
    return client.name || 'PLAYER ' + ((client.slot || 0) + 1);
}

export function getLocalClient(
    model?: LobbyModel | null,
    playerId?: ClientId | null
): LobbyClient | null {
    const clients = (model && model.clients) || [];

    return (
        clients.find(function (client) {
            return client.id === playerId;
        }) || null
    );
}

export function isLocalClientReady(options: LobbyOptions): boolean {
    const client = getLocalClient(options.model, options.playerId);

    return !!options.localReadyRequested || !!(client && client.ready);
}

export function isLocalClientWaiting(options: LobbyOptions): boolean {
    const client = getLocalClient(options.model, options.playerId);

    return !!(
        client &&
        !isLocalClientReady(options) &&
        options.model &&
        options.model.status !== 'abandoned'
    );
}

export function shouldShowLobbyPrompt(options: LobbyOptions): boolean {
    return (
        (!options.model || options.model.status !== 'abandoned') &&
        !isLocalClientReady(options)
    );
}

export function shouldShowHighScoresScreen(
    options: HighScoresScreenOptions
): boolean {
    const clients = (options.model && options.model.clients) || [];
    const hasReadyClient = clients.some(function (client) {
        return client.ready;
    });
    const now = options.now || new Date().getTime();

    if (hasReadyClient || options.localReadyRequested) {
        return false;
    }

    return Math.floor(now / 7000) % 2 === 1;
}

function getLobbyPlayerLabel(
    model?: LobbyModel | null,
    playerId?: ClientId | null
): string {
    const client = getLocalClient(model, playerId);
    let playerIndex: number;

    if (!model || !client) {
        return '';
    }

    playerIndex = (model.clients || []).findIndex(function (item) {
        return item.id === playerId;
    });

    return 'PLAYER ' + (playerIndex + 1) + ' - ' + getClientName(client);
}

function getGameLabel(model?: LobbyModel | null): string {
    if (!model || !model.gameId) {
        return '';
    }

    return 'GAME ' + model.gameId;
}

function getLobbySlots(model?: LobbyModel | null): Array<LobbyClient | null> {
    const slots: Array<LobbyClient | null> = [];
    const resolvedModel = model || {};
    const clients = resolvedModel.clients || [];
    const playerLimit =
        resolvedModel.playerLimit || Math.max(2, clients.length);
    let i: number;

    for (i = 0; i < playerLimit; i++) {
        slots.push(clients[i] || null);
    }

    return slots;
}

function getLobbySlotViewModels(options: LobbyOptions): LobbySlotViewModel[] {
    return getLobbySlots(options.model).map(function (client, index) {
        return {
            label: getLobbySlotLabel(
                client,
                index,
                getOpponentSlotMessage(options.model)
            ),
            ready: !!(client && client.ready)
        };
    });
}

function getLobbySlotLabel(
    client: LobbyClient | null,
    index: number,
    opponentMessage: string
): string {
    if (!client) {
        if (opponentMessage) {
            return 'PLAYER ' + (index + 1) + ' : ' + opponentMessage;
        }

        return 'PLAYER ' + (index + 1) + ' : WAITING';
    }

    return (
        'PLAYER ' +
        (index + 1) +
        ' - ' +
        getClientName(client) +
        ' : ' +
        (client.ready ? 'READY' : 'WAITING')
    );
}

function getOpponentSlotMessage(model?: LobbyModel | null): string {
    const message = getLobbyMessage(model);

    return isOpponentSlotMessage(message) ? message : '';
}

function isOpponentSlotMessage(message: string): boolean {
    return message === 'LOOKING FOR CHALLENGER' || message === 'OPPONENT LEFT';
}

function getLobbyMessage(model?: LobbyModel | null): string {
    if (model && model.message) {
        return model.message;
    }

    return '';
}

export function getLobbyViewModel(options: LobbyViewModelOptions) {
    const isTouch = options.isTouch;
    const localClientWaiting = isLocalClientWaiting(options);
    const showPlayPrompt = shouldShowLobbyPrompt(options) && !isTouch;

    return {
        identityLines: [
            getLobbyPlayerLabel(options.model, options.playerId),
            getGameLabel(options.model)
        ],
        controls: isTouch ? [] : controls,
        showControls: !isTouch,
        slots: getLobbySlotViewModels(options),
        showEditPrompt: !isTouch && localClientWaiting,
        editPrompt:
            !isTouch && localClientWaiting ? 'PRESS E TO EDIT NAME' : '',
        playPrompt: showPlayPrompt ? 'PRESS P TO PLAY' : ''
    };
}

export const ClientLobbyViewModel = {
    getClientName,
    getLobbyViewModel,
    getLocalClient,
    isLocalClientReady,
    isLocalClientWaiting,
    shouldShowHighScoresScreen,
    shouldShowLobbyPrompt
};
