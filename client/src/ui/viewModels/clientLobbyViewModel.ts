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

const controls = [
    'h j k l - left down up right',
    'a z - aim up down',
    'Space - shoot'
];
const mainLobbyDuration = 30000;
const highScoresDuration = 7000;

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

    return now % (mainLobbyDuration + highScoresDuration) >= mainLobbyDuration;
}

export function getLobbyViewModel(options: LobbyViewModelOptions) {
    const isTouch = options.isTouch;
    const localClientWaiting = isLocalClientWaiting(options);
    const showPlayPrompt = shouldShowLobbyPrompt(options) && !isTouch;

    return {
        identityLines: [],
        controls: isTouch ? [] : controls,
        showControls: !isTouch,
        slots: [],
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
