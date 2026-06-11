GF.GameHud = function (elements) {
    elements = elements || {};

    function render(options) {
        options = options || {};

        setText(elements.scoreLeft, options.leftScore || 0);
        setText(elements.scoreRight, options.rightScore || 0);
        setText(elements.timer, options.timerLabel);
        setText(elements.roundMessage, options.roundMessage || '');
        renderHitMessage(options.hitMessage);
    }

    function renderHitMessage(hitMessage) {
        if (!hitMessage || !elements.hitMessage) {
            show(elements.hitMessage, false);
            return;
        }

        setText(elements.hitMessage, hitMessage.text);
        elements.hitMessage.style.left =
            (hitMessage.x / GF.Config.canvas.width) * 100 + '%';
        elements.hitMessage.style.top =
            (hitMessage.y / GF.Config.canvas.height) * 100 + '%';
        show(elements.hitMessage, true);
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
