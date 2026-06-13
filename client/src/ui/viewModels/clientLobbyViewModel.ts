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
    players?: Record<ClientId, LobbyPlayerPosition | undefined>;
};

type HighScoresScreenOptions = {
    lastKeyboardActivityAt?: number | null;
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
const keyboardIdleDuration = 15000;
const canvasWidth = 950;
const canvasHeight = 640;
const markerOffsetY = -122;
const nameOffsetY = 42;
const statusOffsetY = 74;

type LobbyPlayerPosition = {
    x: number;
    y: number;
};

type LobbyTextLine = {
    key: string;
    negative?: boolean;
    text: string;
    x: number;
    y: number;
};

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

    if (
        typeof options.lastKeyboardActivityAt === 'number' &&
        now - options.lastKeyboardActivityAt < keyboardIdleDuration
    ) {
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
        playerLabels: getLobbyPlayerLabels(options),
        showEditPrompt: !isTouch && localClientWaiting,
        editPrompt:
            !isTouch && localClientWaiting ? 'PRESS E TO EDIT NAME' : '',
        playPrompt: showPlayPrompt ? 'PRESS P TO PLAY' : ''
    };
}

function getLobbyPlayerLabels(options: LobbyViewModelOptions): LobbyTextLine[] {
    const clients = (options.model && options.model.clients) || [];
    const players = options.players || {};
    const labels: LobbyTextLine[] = [];

    clients.forEach(function (client, index) {
        const player = players[client.id];
        const playerLabel = getClientName({
            ...client,
            slot: index
        });
        const state = client.ready ? 'READY' : 'WAITING';

        if (!player) {
            return;
        }

        if (client.id === options.playerId) {
            labels.push(
                createLobbyTextLine(
                    String(client.id) + '-you',
                    'YOU',
                    player,
                    markerOffsetY
                )
            );
        }

        labels.push(
            createLobbyTextLine(
                String(client.id) + '-name',
                playerLabel,
                player,
                nameOffsetY
            )
        );
        labels.push(
            createLobbyTextLine(
                String(client.id) + '-status',
                state,
                player,
                statusOffsetY,
                state === 'READY'
            )
        );
    });

    return labels;
}

function createLobbyTextLine(
    key: string,
    text: string,
    player: LobbyPlayerPosition,
    offsetY: number,
    negative = false
): LobbyTextLine {
    return {
        key,
        negative,
        text,
        x: getPercent(player.x, canvasWidth),
        y: getPercent(player.y + offsetY, canvasHeight)
    };
}

function getPercent(value: number, total: number) {
    return Math.round((value / total) * 1000000) / 10000;
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
