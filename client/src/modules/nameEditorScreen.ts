type DomElement = {
    addEventListener?: (
        event: string,
        callback: (evt: EventLike) => void
    ) => void;
    appendChild: (element: DomElement) => void;
    className?: string;
    dataset?: Record<string, string | undefined>;
    hidden?: boolean;
    innerHTML?: string;
    textContent?: string | null;
    type?: string;
};

type EventLike = {
    preventDefault: () => void;
};

type DocumentLike = {
    createElement: (tagName: string) => DomElement;
};

type NameEditorScreenElements = {
    document?: DocumentLike;
    editor?: DomElement | null;
    grid?: DomElement | null;
    help?: DomElement | null;
    highScores?: DomElement | null;
    lobbyMain?: DomElement | null;
    value?: DomElement | null;
};

type NameEditorState = {
    cursorCol: number;
    cursorRow: number;
    grid: string[][];
    name?: string;
};

type NameEditorScreenRenderOptions = {
    helpLines?: string[];
    onSelect?: (rowIndex: number, colIndex: number) => void;
    state: NameEditorState;
};

export function NameEditorScreen(elements: NameEditorScreenElements = {}) {
    const ownerDocument = (elements.document || document) as DocumentLike;

    function render(options: NameEditorScreenRenderOptions) {
        show(elements.lobbyMain, false);
        show(elements.highScores, false);
        show(elements.editor, true);
        setText(elements.value, 'NAME: ' + (options.state.name || ' '));
        setLines(elements.help, options.helpLines || []);
        renderGrid(options.state, options.onSelect);
    }

    function hide() {
        show(elements.editor, false);
    }

    function renderGrid(
        state: NameEditorState,
        onSelect?: (rowIndex: number, colIndex: number) => void
    ) {
        if (!elements.grid) {
            return;
        }

        const gridKey = state.cursorRow + ':' + state.cursorCol;

        const gridDataset = getDataset(elements.grid);
        if (gridDataset.gridKey === gridKey) {
            return;
        }

        gridDataset.gridKey = gridKey;
        elements.grid.innerHTML = '';

        state.grid.forEach(function (row, rowIndex) {
            const rowElement = ownerDocument.createElement('div');

            rowElement.className =
                'name-editor-row' + (row.length < 9 ? ' is-short' : '');

            row.forEach(function (value, colIndex) {
                const button = ownerDocument.createElement('button');

                button.type = 'button';
                button.className =
                    'name-editor-key' +
                    (state.cursorRow === rowIndex &&
                    state.cursorCol === colIndex
                        ? ' is-selected negative-text'
                        : '');
                button.textContent = value;
                button.addEventListener?.('pointerdown', function (evt) {
                    evt.preventDefault();
                    if (onSelect) {
                        onSelect(rowIndex, colIndex);
                    }
                });
                rowElement.appendChild(button);
            });

            elements.grid?.appendChild(rowElement);
        });
    }

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

    return {
        hide,
        render
    };
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
