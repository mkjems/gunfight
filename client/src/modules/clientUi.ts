import { GameHud } from './gameHud.js';
import { HighScoresScreen } from './highScoresScreen.js';
import { ClientHudOverlay } from './clientHudOverlay.js';
import { LobbyScreen } from './lobbyScreen.js';
import { NameEditorScreen } from './nameEditorScreen.js';

type ClientUiOptions = {
    document: Document;
};

export function create(options: ClientUiOptions) {
    return ClientHudOverlay.create({
        document: options.document,
        GameHud: GameHud as any,
        HighScoresScreen: HighScoresScreen as any,
        LobbyScreen: LobbyScreen as any,
        NameEditorScreen: NameEditorScreen as any
    });
}

export const ClientUi = {
    create
};
