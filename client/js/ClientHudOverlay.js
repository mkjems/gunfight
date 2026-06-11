GF.ClientHudOverlay = (function () {
    function create(options) {
        var document = options.document;
        var lobbyMain = document.getElementById('lobby-main');
        var highScores = document.getElementById('highScoresScreen');

        return {
            gameHud: document.getElementById('gameHud'),
            lobbyHud: document.getElementById('lobbyHud'),
            gameHudScreen: new GF.GameHud({
                scoreLeft: document.getElementById('scoreLeft'),
                scoreRight: document.getElementById('scoreRight'),
                timer: document.getElementById('roundTimer'),
                roundMessage: document.getElementById('roundMessage'),
                hitMessage: document.getElementById('hitMessage')
            }),
            highScoresScreen: new GF.HighScoresScreen({
                lobbyMain: lobbyMain,
                screen: highScores,
                table: document.getElementById('highScoresTable'),
                playPrompt: document.getElementById('highScoresPlayPrompt')
            }),
            lobbyScreen: new GF.LobbyScreen({
                main: lobbyMain,
                highScores: highScores,
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
            nameEditorScreen: new GF.NameEditorScreen({
                lobbyMain: lobbyMain,
                highScores: highScores,
                editor: document.getElementById('nameEditor'),
                value: document.getElementById('nameEditorValue'),
                grid: document.getElementById('nameEditorGrid'),
                help: document.getElementById('nameEditorHelp')
            })
        };
    }

    function getLobbySection(element) {
        if (!element) {
            return null;
        }

        if (element.closest) {
            return element.closest('.lobby-section');
        }

        return element.parentNode;
    }

    return {
        create: create,
        getLobbySection: getLobbySection
    };
})();
