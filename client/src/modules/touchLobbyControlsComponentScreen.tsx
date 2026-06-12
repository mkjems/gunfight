import { render as renderComponent } from 'preact';

type TouchLobbyControlsComponentScreenElements = {
    root?: HTMLElement | null;
};

type TouchLobbyControlsComponentScreenRenderOptions = {
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

export class TouchLobbyControlsComponentScreen {
    elements: TouchLobbyControlsComponentScreenElements;

    constructor(elements: TouchLobbyControlsComponentScreenElements = {}) {
        this.elements = elements;
    }

    render(options: TouchLobbyControlsComponentScreenRenderOptions = {}) {
        show(this.elements.root, !!options.visible);

        if (this.elements.root) {
            renderComponent(
                <TouchLobbyControls {...options} />,
                this.elements.root
            );
        }
    }
}

function TouchLobbyControls(
    options: TouchLobbyControlsComponentScreenRenderOptions
) {
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

function show(element: HTMLElement | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}
