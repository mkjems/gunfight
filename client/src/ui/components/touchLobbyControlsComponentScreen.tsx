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
    return (
        <>
            <TouchLobbyButton
                id="touchPlayButton"
                label="PLAY GUNFIGHT"
                negative={true}
                onTap={options.onPlay}
                visible={options.showPlayButton ?? options.showMainButtons}
            />
            <TouchLobbyButton
                id="touchEditButton"
                label="EDIT NAME"
                onTap={options.onEdit}
                visible={options.showMainButtons}
            />
            <TouchLobbyButton
                id="touchHighScoresButton"
                label="HIGH SCORES"
                onTap={options.onHighScores}
                visible={options.showMainButtons}
            />
            <TouchLobbyButton
                id="touchBackButton"
                label="BACK TO LOBBY"
                onTap={options.onBack}
                visible={options.showBackButton}
            />
        </>
    );
}

function TouchLobbyButton(props: TouchLobbyButtonProps) {
    return (
        <button
            className={props.negative ? 'negative-button' : ''}
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
