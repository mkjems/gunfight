GF.HighScoresScreen = function (elements) {
    elements = elements || {};

    function render(options) {
        options = options || {};

        show(elements.lobbyMain, false);
        show(elements.screen, true);
        renderTable(options.rows || []);
        setText(elements.playPrompt, options.playPrompt || '');
    }

    function renderTable(rows) {
        var key = rows
            .map(function (row) {
                return [row.name, row.wins, row.kills, row.deaths].join(':');
            })
            .join('|');

        if (!elements.table) {
            return;
        }

        if (elements.table.dataset.highScoresKey === key) {
            return;
        }

        elements.table.dataset.highScoresKey = key;
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
        var emptyRow = document.createElement('div');

        emptyRow.className = 'high-score-empty';
        emptyRow.textContent = 'NO SCORES YET';
        elements.table.appendChild(emptyRow);
    }

    function appendRow(values, isHeader) {
        var rowElement;

        if (!elements.table) {
            return;
        }

        rowElement = document.createElement('div');
        rowElement.className =
            'high-score-row' + (isHeader ? ' is-header' : '');
        values.forEach(function (value) {
            var cell = document.createElement('span');

            cell.textContent = value;
            rowElement.appendChild(cell);
        });
        elements.table.appendChild(rowElement);
    }

    function setText(element, text) {
        if (element) {
            element.textContent =
                typeof text === 'undefined' || text === null
                    ? ''
                    : String(text);
        }
    }

    function show(element, visible) {
        if (element) {
            element.hidden = !visible;
        }
    }

    return {
        render: render
    };
};
