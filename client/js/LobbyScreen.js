GF.LobbyScreen = function (elements) {
    elements = elements || {};

    function render(options) {
        options = options || {};

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

    function renderSlots(slots) {
        var key = slots
            .map(function (slot) {
                return slot.label + ':' + !!slot.ready;
            })
            .join('\n');

        if (!elements.slots) {
            return;
        }

        if (elements.slots.dataset.linesKey === key) {
            return;
        }

        elements.slots.dataset.linesKey = key;
        elements.slots.innerHTML = '';
        slots.forEach(function (slot) {
            var slotElement = document.createElement('div');

            slotElement.className =
                'lobby-slot' + (slot.ready ? ' negative-text' : '');
            slotElement.textContent = slot.label;
            elements.slots.appendChild(slotElement);
        });
    }

    function clear() {
        setLines(elements.identity, []);
        setLines(elements.controls, []);
        if (elements.slots) {
            elements.slots.innerHTML = '';
            elements.slots.dataset.linesKey = '';
        }
        setText(elements.editPrompt, '');
        setText(elements.playPrompt, '');
        show(elements.playPrompt, false);
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
        clear: clear,
        render: render
    };
};
