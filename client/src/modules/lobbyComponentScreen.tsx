import { render as renderComponent } from 'preact';
import { arePropsEqual } from './componentRenderProps.js';

type LobbyComponentScreenElements = {
    highScores?: HTMLElement | null;
    main?: HTMLElement | null;
};

type LobbySlot = {
    label: string;
    ready: boolean;
};

type LobbyComponentScreenRenderOptions = {
    controls?: string[];
    editPrompt?: string;
    identityLines?: string[];
    playPrompt?: string;
    showControls?: boolean;
    showEditPrompt?: boolean;
    slots?: LobbySlot[];
};

type LinesProps = {
    lines: string[];
};

type LobbySlotsProps = {
    slots: LobbySlot[];
};

type TextProps = {
    text: string;
};

export class LobbyComponentScreen {
    elements: LobbyComponentScreenElements;
    lastRenderedOptions?: LobbyComponentScreenRenderOptions;

    constructor(elements: LobbyComponentScreenElements = {}) {
        this.elements = elements;
    }

    render(options: LobbyComponentScreenRenderOptions = {}) {
        show(this.elements.main, true);
        show(this.elements.highScores, false);

        return this.renderMain(options);
    }

    clear() {
        return this.renderMain({});
    }

    renderMain(options: LobbyComponentScreenRenderOptions) {
        if (!this.elements.main) {
            return false;
        }

        if (
            this.lastRenderedOptions &&
            arePropsEqual(this.lastRenderedOptions, options)
        ) {
            return false;
        }

        renderComponent(<LobbyMain {...options} />, this.elements.main);
        this.lastRenderedOptions = options;

        return true;
    }
}

function LobbyMain(options: LobbyComponentScreenRenderOptions = {}) {
    return (
        <>
            <h1>GUNFIGHT 1975</h1>
            <div className="lobby-section">
                <div id="lobbyIdentity">
                    <Lines lines={options.identityLines || []} />
                </div>
            </div>
            <div className="lobby-section" hidden={!options.showControls}>
                <div id="lobbyControlsText">
                    <Lines lines={options.controls || []} />
                </div>
            </div>
            <div className="lobby-section">
                <div id="lobbySlots">
                    <LobbySlots slots={options.slots || []} />
                </div>
            </div>
            <div className="lobby-section">
                <div id="lobbyEditPrompt" hidden={!options.showEditPrompt}>
                    <Text text={options.editPrompt || ''} />
                </div>
                <div id="lobbyPlayPrompt" className="blink-text">
                    <Text text={options.playPrompt || ''} />
                </div>
            </div>
        </>
    );
}

function Lines(props: LinesProps) {
    return (
        <>
            {props.lines
                .filter(function (line) {
                    return line;
                })
                .map(function (line, index) {
                    return <div key={index}>{line}</div>;
                })}
        </>
    );
}

function LobbySlots(props: LobbySlotsProps) {
    return (
        <>
            {props.slots.map(function (slot, index) {
                return (
                    <div
                        className={
                            'lobby-slot' + (slot.ready ? ' negative-text' : '')
                        }
                        key={index}
                    >
                        {slot.label}
                    </div>
                );
            })}
        </>
    );
}

function Text(props: TextProps) {
    return <>{props.text}</>;
}

function show(element: HTMLElement | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}
