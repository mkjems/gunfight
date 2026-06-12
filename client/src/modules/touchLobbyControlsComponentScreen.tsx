export type TouchLobbyControlsProps = {
    onEdit?: () => void;
    onPlay?: () => void;
    showButtons?: boolean;
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
                visible={options.showButtons}
            />
            <TouchLobbyButton
                id="touchPlayButton"
                label="TAP PLAY"
                onTap={options.onPlay}
                visible={options.showButtons}
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
