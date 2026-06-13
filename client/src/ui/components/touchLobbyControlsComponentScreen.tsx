export type TouchLobbyControlsProps = {
    onBack?: () => void;
    onEdit?: () => void;
    onHighScores?: () => void;
    onPlay?: () => void;
    showBackButton?: boolean;
    showMainButtons?: boolean;
    visible?: boolean;
};

type TouchLobbyButtonProps = {
    id: string;
    label: string;
    onTap?: () => void;
    visible?: boolean;
};

export function TouchLobbyControls(options: TouchLobbyControlsProps = {}) {
    return (
        <>
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
                id="touchPlayButton"
                label="PLAY GUNFIGHT"
                onTap={options.onPlay}
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
