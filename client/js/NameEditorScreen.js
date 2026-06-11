GF.NameEditorScreen = function (elements) {
    elements = elements || {};

    function render(options) {
        options = options || {};

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

    function renderGrid(state, onSelect) {
        var gridKey;

        if (!elements.grid) {
            return;
        }

        gridKey = state.cursorRow + ':' + state.cursorCol;

        if (elements.grid.dataset.gridKey === gridKey) {
            return;
        }

        elements.grid.dataset.gridKey = gridKey;
        elements.grid.innerHTML = '';

        state.grid.forEach(function (row, rowIndex) {
            var rowElement = document.createElement('div');

            rowElement.className =
                'name-editor-row' + (row.length < 9 ? ' is-short' : '');

            row.forEach(function (value, colIndex) {
                var button = document.createElement('button');

                button.type = 'button';
                button.className =
                    'name-editor-key' +
                    (state.cursorRow === rowIndex &&
                    state.cursorCol === colIndex
                        ? ' is-selected negative-text'
                        : '');
                button.textContent = value;
                button.addEventListener('pointerdown', function (evt) {
                    evt.preventDefault();
                    if (onSelect) {
                        onSelect(rowIndex, colIndex);
                    }
                });
                rowElement.appendChild(button);
            });

            elements.grid.appendChild(rowElement);
        });
    }

    function setText(element, text) {
        if (element) {
            element.textContent =
                typeof text === 'undefined' || text === null
                    ? ''
                    : String(text);
        }
    }

    function setLines(element, lines) {
        var key;

        if (!element) {
            return;
        }

        key = lines
            .filter(function (line) {
                return line;
            })
            .join('\n');

        if (element.dataset.linesKey === key) {
            return;
        }

        element.dataset.linesKey = key;
        element.innerHTML = '';
        key.split('\n')
            .filter(function (line) {
                return line;
            })
            .forEach(function (line) {
                var lineElement = document.createElement('div');

                lineElement.textContent = line;
                element.appendChild(lineElement);
            });
    }

    function show(element, visible) {
        if (element) {
            element.hidden = !visible;
        }
    }

    return {
        hide: hide,
        render: render
    };
};
