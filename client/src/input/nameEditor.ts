type KeyEventPayload = {
    action: string;
    key: string;
};

type NameEditorOptions = {
    maxLength?: number;
    onChange?: () => void;
    onSubmit?: (name: string) => void;
};

type CloseOptions = {
    submit?: boolean;
};

const defaultGrid = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    ['DEL', 'RND', 'OK']
];

const randomNames = [
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

export function NameEditor(options: NameEditorOptions = {}) {
    const maxLength = options.maxLength || 8;
    const onSubmit = options.onSubmit || function () {};
    const onChange = options.onChange || function () {};
    let active = false;
    let name = '';
    let cursorRow = 0;
    let cursorCol = 0;
    const grid = defaultGrid;

    function sanitize(nextName: unknown) {
        return String(nextName || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, maxLength);
    }

    function setName(nextName: unknown) {
        name = sanitize(nextName);
        onChange();
    }

    function open(nextName: unknown) {
        setName(nextName);
        active = true;
        cursorRow = 0;
        cursorCol = 0;
        onChange();
    }

    function close(options: CloseOptions = {}) {
        active = false;

        if (options.submit) {
            onSubmit(name);
        }

        onChange();
    }

    function move(dx: number, dy: number) {
        cursorRow = Math.max(0, Math.min(grid.length - 1, cursorRow + dy));
        cursorCol = Math.max(
            0,
            Math.min(grid[cursorRow].length - 1, cursorCol + dx)
        );
        onChange();
    }

    function selectValue(value: string) {
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

    function select(rowIndex: number, colIndex: number) {
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

    function handleKeyEvent(keyEvent: KeyEventPayload) {
        if (keyEvent.action !== 'down') {
            return active ? false : undefined;
        }

        if (!active && keyEvent.key === 'e') {
            open(name);
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
            active,
            cursorCol,
            cursorRow,
            grid,
            name
        };
    }

    return {
        close,
        getState,
        handleKeyEvent,
        isActive: function () {
            return active;
        },
        open,
        select,
        setName
    };
}
