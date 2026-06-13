type KeyAction = 'down' | 'up';

type KeyEventPayload = {
    action: KeyAction;
    key: string;
    player: string | number;
};

type KeyboardEventLike = {
    key: string;
    preventDefault: () => void;
    target?: {
        isContentEditable?: boolean;
        tagName?: string;
    } | null;
};

type DocumentLike = {
    addEventListener: (
        eventName: 'keydown' | 'keyup',
        callback: (evt: KeyboardEventLike) => void
    ) => void;
};

type SocketLike = {
    emit: (eventName: string, payload?: unknown) => void;
};

type KeysModelOptions = {
    canReady?: () => boolean;
    document?: DocumentLike;
    onReady?: () => void;
};

export function KeysModel(
    socket: SocketLike,
    playerId: string | number,
    onLocalKeyEvent: (keyEvent: KeyEventPayload) => boolean | void,
    options: KeysModelOptions = {}
) {
    const ownerDocument = (options.document || document) as DocumentLike;
    const internalKeyStatus: Record<string, boolean> = {};
    const inputKeys = ['h', 'j', 'k', 'l', 'a', 'z', ' ', 'e', 's'];
    let currentPlayerId = playerId;

    function emitKeyEvent(key: string, action: KeyAction) {
        const keyEvent = {
            key,
            player: currentPlayerId,
            action
        };
        const result = onLocalKeyEvent(keyEvent);

        if (result === false) {
            return;
        }

        socket.emit('clientKeyEvent', keyEvent);
    }

    function press(key: string) {
        key = normalizeKey(key);

        if (internalKeyStatus[key]) {
            return;
        }

        emitKeyEvent(key, 'down');
        internalKeyStatus[key] = true;
    }

    function release(key: string) {
        key = normalizeKey(key);

        if (!internalKeyStatus[key]) {
            return;
        }

        emitKeyEvent(key, 'up');
        internalKeyStatus[key] = false;
    }

    function ready() {
        if (options.canReady && !options.canReady()) {
            return;
        }

        if (internalKeyStatus.p) {
            return;
        }

        socket.emit('clientReady');
        internalKeyStatus.p = true;

        if (options.onReady) {
            options.onReady();
        }
    }

    function releaseReady() {
        internalKeyStatus.p = false;
    }

    function normalizeKey(key: string) {
        return key.length === 1 ? key.toLowerCase() : key;
    }

    function shouldIgnoreKeyboardEvent(evt: KeyboardEventLike) {
        const target = evt.target;
        const tagName = target && target.tagName;

        return (
            tagName === 'INPUT' ||
            tagName === 'TEXTAREA' ||
            tagName === 'SELECT' ||
            !!(target && target.isContentEditable)
        );
    }

    function addKey(strKeyToAdd: string) {
        ownerDocument.addEventListener('keydown', function (evt) {
            if (shouldIgnoreKeyboardEvent(evt)) {
                return;
            }

            if (normalizeKey(evt.key) !== strKeyToAdd) {
                return;
            }
            evt.preventDefault();
            press(strKeyToAdd);
        });

        ownerDocument.addEventListener('keyup', function (evt) {
            if (shouldIgnoreKeyboardEvent(evt)) {
                return;
            }

            if (normalizeKey(evt.key) !== strKeyToAdd) {
                return;
            }
            evt.preventDefault();
            release(strKeyToAdd);
        });
    }

    function bindReadyKey() {
        ownerDocument.addEventListener('keydown', function (evt) {
            if (shouldIgnoreKeyboardEvent(evt)) {
                return;
            }

            if (evt.key !== 'p' && evt.key !== 'P') {
                return;
            }

            evt.preventDefault();
            ready();
        });

        ownerDocument.addEventListener('keyup', function (evt) {
            if (shouldIgnoreKeyboardEvent(evt)) {
                return;
            }

            if (evt.key !== 'p' && evt.key !== 'P') {
                return;
            }

            evt.preventDefault();
            releaseReady();
        });
    }

    inputKeys.forEach(function (val) {
        addKey(val);
    });

    bindReadyKey();

    function isKeyDown(key: string) {
        return internalKeyStatus[key] ? true : false;
    }

    function setPlayerId(nextPlayerId: string | number) {
        currentPlayerId = nextPlayerId;

        Object.keys(internalKeyStatus).forEach(function (key) {
            internalKeyStatus[key] = false;
        });
    }

    return {
        isDown: isKeyDown,
        press,
        ready,
        release,
        releaseReady,
        setPlayerId
    };
}
