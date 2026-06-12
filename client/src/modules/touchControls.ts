import { Config } from './config.js';
import { TouchLobbyControlsComponentScreen } from './touchLobbyControlsComponentScreen.js';

type InputLike = {
    press: (key: string) => void;
    ready: () => void;
    release: (key: string) => void;
};

type ClassListLike = {
    toggle: (className: string, force?: boolean) => void;
};

type PointerEventLike = {
    buttons?: number;
    clientX: number;
    clientY: number;
    pointerId: number;
    preventDefault: () => void;
};

type ElementLike = {
    addEventListener: (
        eventName: string,
        callback: (evt: PointerEventLike) => void
    ) => void;
    classList: ClassListLike;
    getBoundingClientRect: () => {
        height: number;
        left: number;
        top: number;
        width: number;
    };
    hidden: boolean;
    setPointerCapture: (pointerId: number) => void;
    style: {
        top?: string;
        transform?: string;
    };
};

type DocumentLike = {
    getElementById: (id: string) => ElementLike | null;
};

type WindowLike = {
    location: {
        search: string;
    };
    matchMedia?: (query: string) => {
        matches: boolean;
    };
};

type LobbyControlsScreenLike = {
    render: (props: {
        onEdit?: () => void;
        onPlay?: () => void;
        showButtons?: boolean;
        visible?: boolean;
    }) => void;
};

type TouchControlsOptions = {
    document?: DocumentLike;
    getAimLevel?: () => number;
    input?: InputLike;
    lobbyControlsScreen?: LobbyControlsScreenLike;
    window?: WindowLike;
};

type TouchControlsState = {
    aimLevel?: number;
    editing?: boolean;
    gameplay?: boolean;
    highScoresVisible?: boolean;
    playing?: boolean;
    ready?: boolean;
    waiting?: boolean;
};

export function TouchControls(options: TouchControlsOptions = {}) {
    const input = options.input;
    const ownerDocument = (options.document || document) as DocumentLike;
    const ownerWindow = (options.window || window) as WindowLike;
    const getAimLevel =
        options.getAimLevel ||
        function () {
            return Config.player.defaultAim;
        };
    const maxAimLevel = Config.player.aimLevels.length - 1;
    const root = ownerDocument.getElementById('touchControls');
    const lobbyControlsScreen =
        options.lobbyControlsScreen ||
        new TouchLobbyControlsComponentScreen({
            root: ownerDocument.getElementById(
                'touchLobbyControls'
            ) as unknown as HTMLElement | null
        });
    const joystick = ownerDocument.getElementById('touchJoystick');
    const joystickKnob = ownerDocument.getElementById('touchJoystickKnob');
    const actionControls = ownerDocument.getElementById('touchActionControls');
    const aimSlider = ownerDocument.getElementById('touchAimSlider');
    const aimHandle = ownerDocument.getElementById('touchAimHandle');
    const shootButton = ownerDocument.getElementById('touchShootButton');
    let activeMoveKeys: Record<string, boolean> = {};
    let visible = false;
    let editing = false;

    function init() {
        if (!root || !input) {
            return;
        }

        visible = shouldEnableTouchControls();

        if (!visible) {
            root.hidden = true;
            lobbyControlsScreen.render({
                visible: false
            });
            return;
        }

        root.classList.toggle(
            'debug-touch',
            ownerWindow.location.search.indexOf('touch=1') >= 0
        );
        root.hidden = false;
        bindJoystick();
        bindAimSlider();
        bindButton(
            shootButton,
            function () {
                input.press(' ');
            },
            function () {
                input.release(' ');
            }
        );
    }

    function onPlayTap() {
        input?.ready();
    }

    function onEditTap() {
        input?.press('e');
        input?.release('e');
    }

    function shouldEnableTouchControls() {
        if (ownerWindow.location.search.indexOf('touch=1') >= 0) {
            return true;
        }

        return !!(
            ownerWindow.matchMedia &&
            ownerWindow.matchMedia('(pointer: coarse)').matches
        );
    }

    function bindJoystick() {
        if (!joystick) {
            return;
        }

        joystick.addEventListener('pointerdown', function (evt) {
            evt.preventDefault();
            joystick.setPointerCapture(evt.pointerId);
            updateJoystick(evt);
        });

        joystick.addEventListener('pointermove', function (evt) {
            if (evt.buttons === 0) {
                return;
            }

            evt.preventDefault();
            updateJoystick(evt);
        });

        joystick.addEventListener('pointerup', resetJoystick);
        joystick.addEventListener('pointercancel', resetJoystick);
        joystick.addEventListener('lostpointercapture', resetJoystick);
    }

    function updateJoystick(evt: PointerEventLike) {
        if (!joystick) {
            return;
        }

        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = rect.width / 2;
        let dx = evt.clientX - centerX;
        let dy = evt.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxKnobDistance = radius * 0.52;
        const normalizedX = dx / radius;
        const normalizedY = dy / radius;
        const threshold = 0.22;
        const nextKeys: Record<string, boolean> = {};

        if (distance > maxKnobDistance) {
            dx = (dx / distance) * maxKnobDistance;
            dy = (dy / distance) * maxKnobDistance;
        }

        if (joystickKnob) {
            joystickKnob.style.transform =
                'translate(' + dx + 'px, ' + dy + 'px)';
        }

        if (normalizedX < -threshold) {
            nextKeys.h = true;
        }

        if (normalizedX > threshold) {
            nextKeys.l = true;
        }

        if (normalizedY < -threshold) {
            nextKeys.k = true;
        }

        if (normalizedY > threshold) {
            nextKeys.j = true;
        }

        applyMoveKeys(nextKeys);
    }

    function applyMoveKeys(nextKeys: Record<string, boolean>) {
        ['h', 'j', 'k', 'l'].forEach(function (key) {
            if (nextKeys[key] && !activeMoveKeys[key]) {
                input?.press(key);
            }

            if (!nextKeys[key] && activeMoveKeys[key]) {
                input?.release(key);
            }
        });

        activeMoveKeys = nextKeys;
    }

    function resetJoystick() {
        applyMoveKeys({});

        if (joystickKnob) {
            joystickKnob.style.transform = 'translate(0, 0)';
        }
    }

    function bindAimSlider() {
        if (!aimSlider) {
            return;
        }

        aimSlider.addEventListener('pointerdown', function (evt) {
            evt.preventDefault();
            aimSlider.setPointerCapture(evt.pointerId);
            updateAim(evt);
        });

        aimSlider.addEventListener('pointermove', function (evt) {
            if (evt.buttons === 0) {
                return;
            }

            evt.preventDefault();
            updateAim(evt);
        });
    }

    function updateAim(evt: PointerEventLike) {
        if (!aimSlider) {
            return;
        }

        const rect = aimSlider.getBoundingClientRect();
        const progress = (evt.clientY - rect.top) / rect.height;
        const level = Math.round((1 - clamp(progress, 0, 1)) * maxAimLevel);

        setAimLevel(level);
    }

    function setAimLevel(level: number) {
        let currentLevel = getAimLevel();

        level = Math.max(0, Math.min(maxAimLevel, level));

        while (currentLevel !== level) {
            const key = level > currentLevel ? 'a' : 'z';
            input?.press(key);
            input?.release(key);
            currentLevel += level > currentLevel ? 1 : -1;
        }

        updateAimHandle(level);
    }

    function updateAimHandle(level: number) {
        if (!aimHandle) {
            return;
        }

        const progress = maxAimLevel ? 1 - level / maxAimLevel : 0;
        aimHandle.style.top = progress * 100 + '%';
    }

    function bindButton(
        button: ElementLike | null,
        onDown: () => void,
        onUp: () => void
    ) {
        if (!button) {
            return;
        }

        button.addEventListener('pointerdown', function (evt) {
            evt.preventDefault();
            button.setPointerCapture(evt.pointerId);
            onDown();
        });

        button.addEventListener('pointerup', function (evt) {
            evt.preventDefault();
            onUp();
        });

        button.addEventListener('pointercancel', onUp);
        button.addEventListener('lostpointercapture', onUp);
    }

    function update(state: TouchControlsState = {}) {
        if (!root || !visible) {
            return;
        }

        editing = !!state.editing;
        const showGameplayControls = state.gameplay || state.playing || editing;
        root.classList.toggle('is-waiting', state.waiting);
        root.classList.toggle('is-playing', state.playing);
        root.classList.toggle('is-editing', editing);

        lobbyControlsScreen.render({
            onEdit: onEditTap,
            onPlay: onPlayTap,
            showButtons: !state.highScoresVisible && !state.ready,
            visible: !!state.waiting && !editing
        });

        if (actionControls) {
            actionControls.hidden = !showGameplayControls;
        }

        if (joystick) {
            joystick.hidden = !showGameplayControls;
        }

        if (!showGameplayControls) {
            resetJoystick();
            input?.release(' ');
        }

        if (!editing) {
            updateAimHandle(
                typeof state.aimLevel === 'number'
                    ? state.aimLevel
                    : getAimLevel()
            );
        }
    }

    function clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value));
    }

    init();

    return {
        update
    };
}
