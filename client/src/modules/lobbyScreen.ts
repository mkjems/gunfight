type DomElement = {
    appendChild: (element: DomElement) => void;
    className?: string;
    dataset?: Record<string, string | undefined>;
    hidden?: boolean;
    innerHTML?: string;
    textContent?: string | null;
};

type DocumentLike = {
    createElement: (tagName: string) => DomElement;
};

type LobbyScreenElements = {
    controls?: DomElement | null;
    controlsSection?: DomElement | null;
    document?: DocumentLike;
    editPrompt?: DomElement | null;
    editPromptSection?: DomElement | null;
    highScores?: DomElement | null;
    identity?: DomElement | null;
    main?: DomElement | null;
    playPrompt?: DomElement | null;
    slots?: DomElement | null;
};

type LobbySlot = {
    label: string;
    ready: boolean;
};

type LobbyScreenRenderOptions = {
    controls?: string[];
    editPrompt?: string;
    identityLines?: string[];
    playPrompt?: string;
    showControls?: boolean;
    showEditPrompt?: boolean;
    slots?: LobbySlot[];
};

export function LobbyScreen(elements: LobbyScreenElements = {}) {
    const ownerDocument = (elements.document || document) as DocumentLike;

    function render(options: LobbyScreenRenderOptions = {}) {
        show(elements.main, true);
        show(elements.highScores, false);
        setLines(elements.identity, options.identityLines || []);
        show(elements.controlsSection, !!options.showControls);
        setLines(elements.controls, options.controls || []);
        renderSlots(options.slots || []);
        show(elements.editPromptSection, !!options.showEditPrompt);
        setText(elements.editPrompt, options.editPrompt || '');
        show(elements.playPrompt, true);
        setText(elements.playPrompt, options.playPrompt || '');
    }

    function renderSlots(slots: LobbySlot[]) {
        const key = slots
            .map(function (slot) {
                return slot.label + ':' + !!slot.ready;
            })
            .join('\n');

        if (!elements.slots) {
            return;
        }

        const slotsDataset = getDataset(elements.slots);
        if (slotsDataset.linesKey === key) {
            return;
        }

        slotsDataset.linesKey = key;
        elements.slots.innerHTML = '';
        slots.forEach(function (slot) {
            const slotElement = ownerDocument.createElement('div');

            slotElement.className =
                'lobby-slot' + (slot.ready ? ' negative-text' : '');
            slotElement.textContent = slot.label;
            elements.slots?.appendChild(slotElement);
        });
    }

    function clear() {
        setLines(elements.identity, []);
        setLines(elements.controls, []);
        if (elements.slots) {
            elements.slots.innerHTML = '';
            getDataset(elements.slots).linesKey = '';
        }
        setText(elements.editPrompt, '');
        setText(elements.playPrompt, '');
        show(elements.playPrompt, false);
    }

    return {
        clear,
        render
    };

    function setLines(element: DomElement | null | undefined, lines: string[]) {
        if (!element) {
            return;
        }

        const key = lines
            .filter(function (line) {
                return line;
            })
            .join('\n');

        const elementDataset = getDataset(element);
        if (elementDataset.linesKey === key) {
            return;
        }

        elementDataset.linesKey = key;
        element.innerHTML = '';
        key.split('\n')
            .filter(function (line) {
                return line;
            })
            .forEach(function (line) {
                const lineElement = ownerDocument.createElement('div');

                lineElement.textContent = line;
                element.appendChild(lineElement);
            });
    }
}

function setText(element: DomElement | null | undefined, text: unknown) {
    if (element) {
        element.textContent =
            typeof text === 'undefined' || text === null ? '' : String(text);
    }
}

function show(element: DomElement | null | undefined, visible: boolean) {
    if (element) {
        element.hidden = !visible;
    }
}

function getDataset(element: DomElement) {
    if (!element.dataset) {
        element.dataset = {};
    }

    return element.dataset;
}
