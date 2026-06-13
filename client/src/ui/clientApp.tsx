import { render as renderComponent } from 'preact';
import { arePropsEqual } from './componentRenderProps.js';
import {
    GameHudComponent,
    type GameHudProps
} from './components/gameHudComponentScreen.js';
import {
    HighScoresScreen,
    type HighScoresProps
} from './components/highScoresComponentScreen.js';
import {
    LobbyMain,
    type LobbyComponentProps
} from './components/lobbyComponentScreen.js';
import {
    NameEditorComponent,
    type NameEditorProps
} from './components/nameEditorComponentScreen.js';
import { Screen } from '../state/clientScreens.js';
import {
    TouchGameplayControls,
    type TouchGameplayControlsProps
} from './components/touchGameplayControlsComponentScreen.js';
import {
    TouchLobbyControls,
    type TouchLobbyControlsProps
} from './components/touchLobbyControlsComponentScreen.js';
import { type InstallPromptProps } from './installPrompt.js';

export type TouchControlsAppProps = {
    debug?: boolean;
    editing?: boolean;
    enabled?: boolean;
    gameplay?: TouchGameplayControlsProps;
    lobby?: TouchLobbyControlsProps;
    playing?: boolean;
    waiting?: boolean;
};

export type ClientAppProps = {
    activeScreen: Screen;
    gameHud?: GameHudProps;
    highScores?: HighScoresProps;
    installPrompt?: InstallPromptProps;
    lobby?: LobbyComponentProps;
    nameEditor?: NameEditorProps;
    touchControls?: TouchControlsAppProps;
};

type ClientAppMountOptions = {
    afterRender?: () => void;
    root?: HTMLElement | null;
};

const defaultInstallPrompt: InstallPromptProps = {
    canInstall: false,
    onDismiss() {},
    onInstall() {},
    text: 'SHARE - ADD TO HOME SCREEN',
    visible: false
};

const defaultTouchControls: TouchControlsAppProps = {
    debug: false,
    editing: false,
    enabled: false,
    gameplay: {
        visible: false
    },
    lobby: {
        showBackButton: false,
        showMainButtons: false,
        visible: false
    },
    playing: false,
    waiting: false
};

export function createClientAppMount(options: ClientAppMountOptions = {}) {
    let lastRenderedProps: ClientAppProps | null = null;

    function render(nextProps: ClientAppProps) {
        if (!options.root) {
            return false;
        }

        if (lastRenderedProps && arePropsEqual(lastRenderedProps, nextProps)) {
            return false;
        }

        renderComponent(<ClientApp {...nextProps} />, options.root);
        lastRenderedProps = nextProps;
        options.afterRender?.();

        return true;
    }

    function renderInitial() {
        return render({
            activeScreen: Screen.LOBBY_MAIN,
            installPrompt: defaultInstallPrompt,
            touchControls: defaultTouchControls
        });
    }

    return {
        render,
        renderInitial
    };
}

export function ClientApp(props: ClientAppProps) {
    const activeScreen = props.activeScreen || Screen.LOBBY_MAIN;
    const touchControls = {
        ...defaultTouchControls,
        ...(props.touchControls || {}),
        gameplay: {
            ...defaultTouchControls.gameplay,
            ...(props.touchControls?.gameplay || {})
        },
        lobby: {
            ...defaultTouchControls.lobby,
            ...(props.touchControls?.lobby || {})
        }
    };
    const installPrompt = {
        ...defaultInstallPrompt,
        ...(props.installPrompt || {})
    };

    return (
        <>
            <RotatePrompt />
            <InstallPrompt {...installPrompt} />
            <div id="hudOverlay" aria-live="polite">
                <div hidden={activeScreen !== Screen.GAME} id="gameHud">
                    <GameHudComponent {...(props.gameHud || {})} />
                </div>
                <div hidden={activeScreen === Screen.GAME} id="lobbyHud">
                    <div
                        hidden={activeScreen !== Screen.LOBBY_MAIN}
                        id="lobby-main"
                    >
                        <LobbyMain {...(props.lobby || {})} />
                    </div>
                    <div
                        hidden={activeScreen !== Screen.HIGH_SCORES}
                        id="highScoresScreen"
                    >
                        <HighScoresScreen {...(props.highScores || {})} />
                    </div>
                    <div
                        hidden={activeScreen !== Screen.LOBBY_EDIT_NAME}
                        id="nameEditor"
                    >
                        <NameEditorComponent {...(props.nameEditor || {})} />
                    </div>
                    <div
                        hidden={!touchControls.lobby.visible}
                        className={
                            activeScreen === Screen.HIGH_SCORES
                                ? 'is-high-scores'
                                : ''
                        }
                        id="touchLobbyControls"
                    >
                        <TouchLobbyControls {...touchControls.lobby} />
                    </div>
                </div>
            </div>
            <div
                className={getTouchControlsClassName(touchControls)}
                hidden={!touchControls.enabled}
                id="touchControls"
            >
                <TouchGameplayControls {...touchControls.gameplay} />
            </div>
        </>
    );
}

function RotatePrompt() {
    return (
        <div id="rotatePrompt">
            <img
                alt="Rotate your device to landscape"
                src="/images/RotatePlease.png"
            />
        </div>
    );
}

function InstallPrompt(props: InstallPromptProps) {
    return (
        <div
            className={props.visible ? 'is-visible' : ''}
            hidden={!props.visible}
            id="installPrompt"
        >
            <button
                aria-label="Dismiss install instructions"
                id="installPromptClose"
                onClick={props.onDismiss}
                type="button"
            >
                X
            </button>
            <div>FULL SCREEN MODE</div>
            <div id="installPromptText">{props.text}</div>
            <button
                hidden={!props.canInstall}
                id="installPromptButton"
                onClick={props.onInstall}
                type="button"
            >
                INSTALL
            </button>
        </div>
    );
}

function getTouchControlsClassName(props: TouchControlsAppProps) {
    return [
        props.debug ? 'debug-touch' : '',
        props.waiting ? 'is-waiting' : '',
        props.playing ? 'is-playing' : '',
        props.editing ? 'is-editing' : ''
    ]
        .filter(Boolean)
        .join(' ');
}

export const ClientAppMount = {
    create: createClientAppMount
};
