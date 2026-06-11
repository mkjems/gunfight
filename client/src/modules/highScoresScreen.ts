type HighScoreRow = {
    deaths: number;
    kills: number;
    name: string;
    wins: number;
};

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

type HighScoresScreenElements = {
    document?: DocumentLike;
    lobbyMain?: DomElement | null;
    playPrompt?: DomElement | null;
    screen?: DomElement | null;
    table?: DomElement | null;
};

type HighScoresScreenRenderOptions = {
    playPrompt?: string;
    rows?: HighScoreRow[];
};

export function HighScoresScreen(elements: HighScoresScreenElements = {}) {
    const ownerDocument = (elements.document || document) as DocumentLike;

    function render(options: HighScoresScreenRenderOptions = {}) {
        show(elements.lobbyMain, false);
        show(elements.screen, true);
        renderTable(options.rows || []);
        setText(elements.playPrompt, options.playPrompt || '');
    }

    function renderTable(rows: HighScoreRow[]) {
        const key = rows
            .map(function (row) {
                return [row.name, row.wins, row.kills, row.deaths].join(':');
            })
            .join('|');

        if (!elements.table) {
            return;
        }

        const tableDataset = getDataset(elements.table);
        if (tableDataset.highScoresKey === key) {
            return;
        }

        tableDataset.highScoresKey = key;
        elements.table.innerHTML = '';
        appendRow(['NAME', 'WINS', 'KILLS', 'DEATHS'], true);

        if (!rows.length) {
            appendEmptyRow();
            return;
        }

        rows.forEach(function (row) {
            appendRow([row.name, row.wins, row.kills, row.deaths], false);
        });
    }

    function appendEmptyRow() {
        const emptyRow = ownerDocument.createElement('div');

        emptyRow.className = 'high-score-empty';
        emptyRow.textContent = 'NO SCORES YET';
        elements.table?.appendChild(emptyRow);
    }

    function appendRow(values: unknown[], isHeader: boolean) {
        if (!elements.table) {
            return;
        }

        const rowElement = ownerDocument.createElement('div');
        rowElement.className =
            'high-score-row' + (isHeader ? ' is-header' : '');
        values.forEach(function (value) {
            const cell = ownerDocument.createElement('span');

            cell.textContent = String(value);
            rowElement.appendChild(cell);
        });
        elements.table.appendChild(rowElement);
    }

    return {
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
