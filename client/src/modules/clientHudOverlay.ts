type HudElement = HTMLElement | null;
type LobbySection = Element | ParentNode | null;
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
            root: gameHud,
            scoreLeft: document.getElementById('scoreLeft'),
            scoreRight: document.getElementById('scoreRight'),
            timer: document.getElementById('roundTimer'),
            roundMessage: document.getElementById('roundMessage'),
            hitMessage: document.getElementById('hitMessage')
        }),
        highScoresScreen: new HighScoresScreen({
            lobbyMain,
            screen: highScores,
            table: document.getElementById('highScoresTable'),
            playPrompt: document.getElementById('highScoresPlayPrompt')
        }),
        lobbyScreen: new LobbyScreen({
            main: lobbyMain,
            highScores,
            identity: document.getElementById('lobbyIdentity'),
            controls: document.getElementById('lobbyControlsText'),
            controlsSection: getLobbySection(
                document.getElementById('lobbyControlsText')
            ),
            slots: document.getElementById('lobbySlots'),
            editPrompt: document.getElementById('lobbyEditPrompt'),
            editPromptSection: getLobbySection(
                document.getElementById('lobbyEditPrompt')
            ),
            playPrompt: document.getElementById('lobbyPlayPrompt')
        }),
        nameEditorScreen: new NameEditorScreen({
            lobbyMain,
            highScores,
            editor: document.getElementById('nameEditor'),
            value: document.getElementById('nameEditorValue'),
            grid: document.getElementById('nameEditorGrid'),
            help: document.getElementById('nameEditorHelp')
        })
    };
}

export function getLobbySection(element: Element | null): LobbySection {
    if (!element) {
        return null;
    }

    if (element.closest) {
        return element.closest('.lobby-section');
    }

    return element.parentNode;
}

export const ClientHudOverlay = {
    create,
    getLobbySection
};
