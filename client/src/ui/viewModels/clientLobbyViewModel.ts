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
    highScoresVisible?: boolean;
    localReadyRequested?: boolean;
    model?: LobbyModel | null;
    playerId?: ClientId | null;
};

type LobbyViewModelOptions = LobbyOptions & {
    isTouch?: boolean;
    players?: Record<ClientId, LobbyPlayerPosition | undefined>;
};

const controls = [
    'h j k l - left down up right',
    'a z - aim up down',
    'Space - shoot'
];
const canvasWidth = 950;
const canvasHeight = 640;
const markerOffsetY = -122;
const nameOffsetY = 42;
const statusOffsetY = 74;
const opponentPlaceholderX = 800;
const opponentPlaceholderY = 400;

type LobbyPlayerPosition = {
    x: number;
    y: number;
};

type LobbyTextLine = {
    key: string;
    negative?: boolean;
    text: string;
    variant?: 'opponent-placeholder-marker' | 'opponent-placeholder-message';
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

export function shouldShowHighScoresScreen(options: LobbyOptions): boolean {
    return !!options.highScoresVisible && isLocalClientWaiting(options);
}

export function getLobbyViewModel(options: LobbyViewModelOptions) {
    const isTouch = options.isTouch;
    const localClientWaiting = isLocalClientWaiting(options);
    const showPlayPrompt = shouldShowLobbyPrompt(options) && !isTouch;
    const opponentPlaceholder = getLobbyOpponentPlaceholder(options);

    return {
        identityLines: [],
        controls: isTouch ? [] : controls,
        showControls: !isTouch,
        slots: [],
        playerLabels: getLobbyPlayerLabels(options),
        ...(opponentPlaceholder.length ? { opponentPlaceholder } : {}),
        showEditPrompt: !isTouch && localClientWaiting,
        editPrompt:
            !isTouch && localClientWaiting ? 'PRESS E TO EDIT NAME' : '',
        highScoresPrompt:
            !isTouch && localClientWaiting ? 'PRESS S TO SEE HIGH SCORES' : '',
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

function getLobbyOpponentPlaceholder(
    options: LobbyViewModelOptions
): LobbyTextLine[] {
    const clients = (options.model && options.model.clients) || [];
    const localClient = getLocalClient(options.model, options.playerId);

    if (
        !localClient ||
        !options.model ||
        options.model.status === 'abandoned' ||
        clients.length !== 1
    ) {
        return [];
    }

    return [
        createLobbyTextLineFromPosition(
            'opponent-placeholder-marker',
            '?',
            {
                x: opponentPlaceholderX,
                y: opponentPlaceholderY
            },
            -80,
            true,
            'opponent-placeholder-marker'
        ),
        createLobbyTextLineFromPosition(
            'opponent-placeholder-message',
            'LOOKING FOR OPPONENT',
            {
                x: opponentPlaceholderX,
                y: opponentPlaceholderY
            },
            statusOffsetY,
            false,
            'opponent-placeholder-message'
        )
    ];
}

function createLobbyTextLine(
    key: string,
    text: string,
    player: LobbyPlayerPosition,
    offsetY: number,
    negative = false
): LobbyTextLine {
    return createLobbyTextLineFromPosition(
        key,
        text,
        player,
        offsetY,
        negative
    );
}

function createLobbyTextLineFromPosition(
    key: string,
    text: string,
    position: LobbyPlayerPosition,
    offsetY: number,
    negative = false,
    variant?: LobbyTextLine['variant']
): LobbyTextLine {
    return {
        key,
        negative,
        text,
        ...(variant ? { variant } : {}),
        x: getPercent(position.x, canvasWidth),
        y: getPercent(position.y + offsetY, canvasHeight)
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
