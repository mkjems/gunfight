import { GameHud } from './gameHud.js';
import { HighScoresComponentScreen } from './highScoresComponentScreen.js';
import { ClientHudOverlay } from './clientHudOverlay.js';
import { LobbyComponentScreen } from './lobbyComponentScreen.js';
import { NameEditorScreen } from './nameEditorScreen.js';

type ClientUiOptions = {
    document: Document;
};

export function create(options: ClientUiOptions) {
    return ClientHudOverlay.create({
        document: options.document,
        GameHud: GameHud as any,
        HighScoresScreen: HighScoresComponentScreen as any,
        LobbyScreen: LobbyComponentScreen as any,
        NameEditorScreen: NameEditorScreen as any
    });
}

export const ClientUi = {
    create
};
