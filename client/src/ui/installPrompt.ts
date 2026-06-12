type BeforeInstallPromptEventLike = Event & {
    prompt: () => void;
    userChoice: Promise<unknown>;
};

type ClassListLike = {
    add: (className: string) => void;
    remove: (className: string) => void;
};

type DocumentLike = {
    addEventListener: (event: string, callback: () => void) => void;
    body: {
        classList: ClassListLike;
    };
    readyState?: string;
};

type MatchMediaResult = {
    matches: boolean;
};

type ServiceWorkerRegistrationLike = {
    unregister: () => void;
};

type ServiceWorkerContainerLike = {
    getRegistrations: () => Promise<readonly ServiceWorkerRegistrationLike[]>;
    register: (scriptUrl: string) => Promise<unknown>;
};

type WindowLike = {
    addEventListener: (
        event: string,
        callback: (evt?: Event | BeforeInstallPromptEventLike) => void
    ) => void;
    isSecureContext?: boolean;
    location: {
        hostname: string;
    };
    matchMedia?: (query: string) => MatchMediaResult;
    navigator: NavigatorLike;
};

type NavigatorLike = {
    serviceWorker?: ServiceWorkerContainerLike;
    standalone?: boolean;
    userAgent: string;
};

type StorageLike = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
};

type InstallPromptOptions = {
    document?: DocumentLike;
    localStorage?: StorageLike;
    onChange?: () => void;
    window?: WindowLike;
};

export type InstallPromptProps = {
    canInstall: boolean;
    onDismiss: () => void;
    onInstall: () => void;
    text: string;
    visible: boolean;
};

export function createInstallPrompt(options: InstallPromptOptions = {}) {
    const ownerDocument = (options.document || document) as DocumentLike;
    const ownerWindow = (options.window || window) as unknown as WindowLike;
    const ownerStorage = (options.localStorage || localStorage) as StorageLike;
    const dismissedStorageKey = 'gunfight-install-prompt-dismissed';
    let deferredInstallPrompt: BeforeInstallPromptEventLike | null = null;
    let initialized = false;
    let canInstall = false;
    let text = 'SHARE - ADD TO HOME SCREEN';
    let visible = false;

    function init() {
        if (initialized) {
            return;
        }

        initialized = true;
        registerServiceWorker();
        bindEvents();
        updateInstructionText();

        if (!isStandalone() && !wasDismissed()) {
            showIfTouchDevice(false);
        }

        syncBodyClass();
    }

    function registerServiceWorker() {
        const serviceWorker = ownerWindow.navigator.serviceWorker;

        if (!serviceWorker) {
            return;
        }

        if (isLocalDevelopment()) {
            serviceWorker
                .getRegistrations()
                .then(function (registrations) {
                    registrations.forEach(function (registration) {
                        registration.unregister();
                    });
                })
                .catch(function () {});
            return;
        }

        if (
            !ownerWindow.isSecureContext &&
            ownerWindow.location.hostname !== 'localhost' &&
            ownerWindow.location.hostname !== '127.0.0.1'
        ) {
            return;
        }

        ownerWindow.addEventListener('load', function () {
            serviceWorker.register('/sw.js').catch(function () {});
        });
    }

    function isLocalDevelopment() {
        return (
            ownerWindow.location.hostname === 'localhost' ||
            ownerWindow.location.hostname === '127.0.0.1' ||
            ownerWindow.location.hostname === ''
        );
    }

    function bindEvents() {
        ownerWindow.addEventListener('beforeinstallprompt', function (evt) {
            const installEvent = evt as BeforeInstallPromptEventLike;

            installEvent.preventDefault();
            deferredInstallPrompt = installEvent;
            canInstall = true;
            showIfTouchDevice();
        });

        ownerWindow.addEventListener('appinstalled', hide);
    }

    function updateInstructionText() {
        text = isIOS() ? 'SHARE - ADD TO HOME SCREEN' : 'MENU - INSTALL APP';
    }

    function showIfTouchDevice(shouldNotify = true) {
        if (!isTouchDevice() || isStandalone() || wasDismissed()) {
            return;
        }

        visible = true;
        syncBodyClass();

        if (shouldNotify) {
            notify();
        }
    }

    function hide() {
        visible = false;
        syncBodyClass();
        notify();
    }

    function dismiss() {
        try {
            ownerStorage.setItem(dismissedStorageKey, '1');
        } catch (err) {}

        hide();
    }

    function install() {
        if (!deferredInstallPrompt) {
            return;
        }

        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(function () {
            deferredInstallPrompt = null;
            canInstall = false;
            notify();
        });
    }

    function getProps(): InstallPromptProps {
        return {
            canInstall,
            onDismiss: dismiss,
            onInstall: install,
            text,
            visible
        };
    }

    function notify() {
        syncBodyClass();
        options.onChange?.();
    }

    function syncBodyClass() {
        if (visible) {
            ownerDocument.body.classList.add('install-prompt-visible');
            return;
        }

        ownerDocument.body.classList.remove('install-prompt-visible');
    }

    function isTouchDevice() {
        return !!(
            ownerWindow.matchMedia &&
            ownerWindow.matchMedia('(pointer: coarse)').matches
        );
    }

    function isStandalone() {
        return !!(
            (ownerWindow.matchMedia &&
                ownerWindow.matchMedia('(display-mode: standalone)').matches) ||
            ownerWindow.navigator.standalone
        );
    }

    function isIOS() {
        return /iphone|ipad|ipod/i.test(ownerWindow.navigator.userAgent);
    }

    function wasDismissed() {
        try {
            return ownerStorage.getItem(dismissedStorageKey) === '1';
        } catch (err) {
            return false;
        }
    }

    if (ownerDocument.readyState === 'loading') {
        ownerDocument.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        getProps,
        hide
    };
}

export const InstallPrompt = {
    create: createInstallPrompt
};
