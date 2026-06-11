import { Config } from './config.js';

type TextElement = {
    hidden?: boolean;
    style?: {
        left?: string;
        top?: string;
    };
    textContent?: string | null;
};

type GameHudElements = {
    hitMessage?: TextElement | null;
    roundMessage?: TextElement | null;
    scoreLeft?: TextElement | null;
    scoreRight?: TextElement | null;
    timer?: TextElement | null;
};

type GameHudRenderOptions = {
    hitMessage?: {
        text: string;
        x: number;
        y: number;
    } | null;
    leftScore?: number;
    rightScore?: number;
    roundMessage?: string;
    timerLabel?: number | string | null;
};

export function GameHud(elements: GameHudElements = {}) {
    function render(options: GameHudRenderOptions = {}) {
        setText(elements.scoreLeft, options.leftScore || 0);
        setText(elements.scoreRight, options.rightScore || 0);
        setText(elements.timer, options.timerLabel);
        setText(elements.roundMessage, options.roundMessage || '');
        renderHitMessage(options.hitMessage);
    }

    function renderHitMessage(hitMessage: GameHudRenderOptions['hitMessage']) {
        if (!hitMessage || !elements.hitMessage) {
            show(elements.hitMessage, false);
            return;
        }

        setText(elements.hitMessage, hitMessage.text);
        if (elements.hitMessage.style) {
            elements.hitMessage.style.left =
                (hitMessage.x / Config.canvas.width) * 100 + '%';
            elements.hitMessage.style.top =
                (hitMessage.y / Config.canvas.height) * 100 + '%';
        }
        show(elements.hitMessage, true);
    }

    return {
        render
    };
}

function setText(element: TextElement | null | undefined, text: unknown) {
    if (element) {
        element.textContent =
            typeof text === 'undefined' || text === null ? '' : String(text);
    }
}

function show(element: TextElement | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}
