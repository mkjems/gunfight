import styles from './touchLobbyControlsComponentScreen.module.css';

export type TouchLobbyControlsProps = {
    onBack?: () => void;
    onEdit?: () => void;
    onHighScores?: () => void;
    onPlay?: () => void;
    showBackButton?: boolean;
    showMainButtons?: boolean;
    showPlayButton?: boolean;
    visible?: boolean;
};

type TouchLobbyButtonProps = {
    id: string;
    label: string;
    negative?: boolean;
    onTap?: () => void;
    visible?: boolean;
};

export function TouchLobbyControls(options: TouchLobbyControlsProps = {}) {
    const showPlayButton = options.showPlayButton ?? options.showMainButtons;
    const showSecondaryButtons = !!options.showMainButtons;
    const showBackButton = !!options.showBackButton;

    return (
        <>
            <div
                className={getRowClassName(styles.primary)}
                hidden={!showPlayButton}
                id="touchLobbyPrimaryRow"
            >
                <TouchLobbyButton
                    id="touchPlayButton"
                    label="PLAY GUNFIGHT"
                    negative={true}
                    onTap={options.onPlay}
                    visible={showPlayButton}
                />
            </div>
            <div
                className={getRowClassName(styles.secondary)}
                hidden={!showSecondaryButtons}
                id="touchLobbySecondaryRow"
            >
                <TouchLobbyButton
                    id="touchEditButton"
                    label="EDIT NAME"
                    onTap={options.onEdit}
                    visible={showSecondaryButtons}
                />
                <TouchLobbyButton
                    id="touchHighScoresButton"
                    label="HIGH SCORES"
                    onTap={options.onHighScores}
                    visible={showSecondaryButtons}
                />
            </div>
            <div
                className={getRowClassName()}
                hidden={!showBackButton}
                id="touchLobbyBackRow"
            >
                <TouchLobbyButton
                    id="touchBackButton"
                    label="BACK TO LOBBY"
                    onTap={options.onBack}
                    visible={showBackButton}
                />
            </div>
        </>
    );
}

function getRowClassName(variant?: string) {
    return variant ? styles.row + ' ' + variant : styles.row;
}

function TouchLobbyButton(props: TouchLobbyButtonProps) {
    return (
        <button
            className={getButtonClassName(props)}
            hidden={!props.visible}
            id={props.id}
            onPointerDown={function (evt) {
                evt.preventDefault();
                props.onTap?.();
            }}
            type="button"
        >
            {props.label}
        </button>
    );
}

function getButtonClassName(props: TouchLobbyButtonProps) {
    return [styles.button, props.negative ? 'negative-button' : '']
        .filter(Boolean)
        .join(' ');
}
