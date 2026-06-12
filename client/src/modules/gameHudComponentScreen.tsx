import { render as renderComponent } from 'preact';
import { arePropsEqual } from './componentRenderProps.js';
import { Config } from './config.js';

type GameHudComponentScreenElements = {
    root?: HTMLElement | null;
};

type HitMessage = {
    text: string;
    x: number;
    y: number;
};

type GameHudComponentScreenRenderOptions = {
    hitMessage?: HitMessage | null;
    leftScore?: number;
    rightScore?: number;
    roundMessage?: string;
    timerLabel?: number | string | null;
};

type HitMessageProps = {
    hitMessage?: HitMessage | null;
};

export class GameHudComponentScreen {
    elements: GameHudComponentScreenElements;
    lastRenderedOptions?: GameHudComponentScreenRenderOptions;

    constructor(elements: GameHudComponentScreenElements = {}) {
        this.elements = elements;
    }

    render(options: GameHudComponentScreenRenderOptions = {}) {
        if (!this.elements.root) {
            return false;
        }

        if (
            this.lastRenderedOptions &&
            arePropsEqual(this.lastRenderedOptions, options)
        ) {
            return false;
        }

        renderComponent(<GameHudComponent {...options} />, this.elements.root);
        this.lastRenderedOptions = options;

        return true;
    }
}

function GameHudComponent(options: GameHudComponentScreenRenderOptions) {
    return (
        <>
            <div id="scoreRow">
                <div id="scoreLeft">{toText(options.leftScore, 0)}</div>
                <div id="roundTimer">{toText(options.timerLabel)}</div>
                <div id="scoreRight">{toText(options.rightScore, 0)}</div>
            </div>
            <div id="roundMessage" className="large-text">
                {toText(options.roundMessage)}
            </div>
            <HitMessageView hitMessage={options.hitMessage} />
        </>
    );
}

function HitMessageView(props: HitMessageProps) {
    const hitMessage = props.hitMessage;

    if (!hitMessage) {
        return <div id="hitMessage" hidden></div>;
    }

    return (
        <div
            id="hitMessage"
            style={{
                left: (hitMessage.x / Config.canvas.width) * 100 + '%',
                top: (hitMessage.y / Config.canvas.height) * 100 + '%'
            }}
        >
            {hitMessage.text}
        </div>
    );
}

function toText(value: unknown, fallback: unknown = '') {
    if (typeof value === 'undefined' || value === null) {
        return String(fallback);
    }

    return String(value);
}
