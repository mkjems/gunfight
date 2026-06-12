import { GameHud } from './gameHud.js';
import { HighScoresComponentScreen } from './highScoresComponentScreen.js';
import { ClientHudOverlay } from './clientHudOverlay.js';
import { LobbyComponentScreen } from './lobbyComponentScreen.js';
import { NameEditorComponentScreen } from './nameEditorComponentScreen.js';

type ClientUiOptions = {
    document: Document;
};

export function create(options: ClientUiOptions) {
    return ClientHudOverlay.create({
        document: options.document,
        GameHud: GameHud as any,
        HighScoresScreen: HighScoresComponentScreen as any,
        LobbyScreen: LobbyComponentScreen as any,
        NameEditorScreen: NameEditorComponentScreen as any
    });
}

export const ClientUi = {
    create
};
