GF.NameEditor = function (options) {
    options = options || {};

    var maxLength = options.maxLength || 8;
    var onSubmit = options.onSubmit || function () {};
    var onChange = options.onChange || function () {};
    var active = false;
    var name = '';
    var cursorRow = 0;
    var cursorCol = 0;
    var grid = [
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
        ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['DEL', 'RND', 'OK']
    ];
    var randomNames = [
        'ACE',
        'KID',
        'DOC',
        'RED',
        'JET',
        'MAX',
        'BUD',
        'CAL',
        'DUK',
        'IKE',
        'REX',
        'SAM'
    ];

    function sanitize(nextName) {
        return String(nextName || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, maxLength);
    }

    function setName(nextName) {
        name = sanitize(nextName);
        onChange();
    }

    function open(nextName) {
        setName(nextName);
        active = true;
        cursorRow = 0;
        cursorCol = 0;
        onChange();
    }

    function close(options) {
        options = options || {};
        active = false;

        if (options.submit) {
            onSubmit(name);
        }

        onChange();
    }

    function move(dx, dy) {
        cursorRow = Math.max(0, Math.min(grid.length - 1, cursorRow + dy));
        cursorCol = Math.max(
            0,
            Math.min(grid[cursorRow].length - 1, cursorCol + dx)
        );
        onChange();
    }

    function selectValue(value) {
        if (value === 'DEL') {
            name = name.slice(0, -1);
            onChange();
            return;
        }

        if (value === 'RND') {
            name = randomNames[Math.floor(Math.random() * randomNames.length)];
            onChange();
            return;
        }

        if (value === 'OK') {
            close({ submit: true });
            return;
        }

        if (name.length < maxLength) {
            name += value;
            onChange();
        }
    }

    function selectCurrent() {
        selectValue(grid[cursorRow][cursorCol]);
    }

    function select(rowIndex, colIndex) {
        if (
            !grid[rowIndex] ||
            typeof grid[rowIndex][colIndex] === 'undefined'
        ) {
            return;
        }

        cursorRow = rowIndex;
        cursorCol = colIndex;
        selectCurrent();
    }

    function handleKeyEvent(keyEvent) {
        if (keyEvent.action !== 'down') {
            return active ? false : undefined;
        }

        if (!active && keyEvent.key === 'e') {
            open('');
            return false;
        }

        if (!active) {
            return undefined;
        }

        if (keyEvent.key === 'e') {
            close({ submit: true });
            return false;
        }

        if (keyEvent.key === 'h') {
            move(-1, 0);
            return false;
        }

        if (keyEvent.key === 'l') {
            move(1, 0);
            return false;
        }

        if (keyEvent.key === 'k') {
            move(0, -1);
            return false;
        }

        if (keyEvent.key === 'j') {
            move(0, 1);
            return false;
        }

        if (keyEvent.key === ' ') {
            selectCurrent();
            return false;
        }

        return false;
    }

    function getState() {
        return {
            active: active,
            cursorCol: cursorCol,
            cursorRow: cursorRow,
            grid: grid,
            name: name
        };
    }

    return {
        close: close,
        getState: getState,
        handleKeyEvent: handleKeyEvent,
        isActive: function () {
            return active;
        },
        open: open,
        select: select,
        setName: setName
    };
};
