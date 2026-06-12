type OverlayFactory = new (elements: any) => unknown;

type OverlayConstructors = {
    GameHud: OverlayFactory;
    HighScoresScreen: OverlayFactory;
    LobbyScreen: OverlayFactory;
    NameEditorScreen: OverlayFactory;
};

type ClientHudOverlayOptions = OverlayConstructors & {
    document: Document;
};

function getConstructor<K extends keyof OverlayConstructors>(
    options: ClientHudOverlayOptions,
    key: K
): OverlayConstructors[K] {
    const constructor = options[key];

    if (!constructor) {
        throw new Error('Missing HUD overlay constructor: ' + key);
    }

    return constructor as OverlayConstructors[K];
}

export function create(options: ClientHudOverlayOptions) {
    const document = options.document;
    const gameHud = document.getElementById('gameHud');
    const lobbyMain = document.getElementById('lobby-main');
    const highScores = document.getElementById('highScoresScreen');
    const GameHud = getConstructor(options, 'GameHud');
    const HighScoresScreen = getConstructor(options, 'HighScoresScreen');
    const LobbyScreen = getConstructor(options, 'LobbyScreen');
    const NameEditorScreen = getConstructor(options, 'NameEditorScreen');

    return {
        gameHud,
        lobbyHud: document.getElementById('lobbyHud'),
        gameHudScreen: new GameHud({
            root: gameHud
        }),
        highScoresScreen: new HighScoresScreen({
            lobbyMain,
            screen: highScores,
            table: document.getElementById('highScoresTable'),
            playPrompt: document.getElementById('highScoresPlayPrompt')
        }),
        lobbyScreen: new LobbyScreen({
            main: lobbyMain,
            highScores
        }),
        nameEditorScreen: new NameEditorScreen({
            lobbyMain,
            highScores,
            editor: document.getElementById('nameEditor')
        })
    };
}

export const ClientHudOverlay = {
    create
};
