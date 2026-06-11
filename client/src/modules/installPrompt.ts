type BeforeInstallPromptEventLike = Event & {
    prompt: () => void;
    userChoice: Promise<unknown>;
};

type ClassListLike = {
    add: (className: string) => void;
    remove: (className: string) => void;
};

type ElementLike = {
    addEventListener?: (event: string, callback: () => void) => void;
    classList: ClassListLike;
    hidden: boolean;
    textContent: string | null;
};

type DocumentLike = {
    addEventListener: (event: string, callback: () => void) => void;
    body: {
        classList: ClassListLike;
    };
    getElementById: (id: string) => ElementLike | null;
};

type MatchMediaResult = {
    matches: boolean;
};

type ServiceWorkerRegistrationLike = {
    unregister: () => void;
};

type ServiceWorkerContainerLike = {
    getRegistrations: () => Promise<ServiceWorkerRegistrationLike[]>;
    register: (scriptUrl: string) => Promise<unknown>;
};

type WindowLike = {
    addEventListener: (
        event: string,
        callback: (evt: BeforeInstallPromptEventLike) => void
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
    window?: WindowLike;
};

export function createInstallPrompt(options: InstallPromptOptions = {}) {
    const ownerDocument = (options.document || document) as DocumentLike;
    const ownerWindow = (options.window || window) as unknown as WindowLike;
    const ownerStorage = (options.localStorage || localStorage) as StorageLike;
    let deferredInstallPrompt: BeforeInstallPromptEventLike | null = null;
    let promptElement: ElementLike | null;
    let promptTextElement: ElementLike | null;
    let promptButton: ElementLike | null;
    let closeButton: ElementLike | null;
    const dismissedStorageKey = 'gunfight-install-prompt-dismissed';

    function init() {
        registerServiceWorker();

        promptElement = ownerDocument.getElementById('installPrompt');
        promptTextElement = ownerDocument.getElementById('installPromptText');
        promptButton = ownerDocument.getElementById('installPromptButton');
        closeButton = ownerDocument.getElementById('installPromptClose');

        if (!promptElement || isStandalone() || wasDismissed()) {
            return;
        }

        bindEvents();
        updateInstructionText();
        showIfTouchDevice();
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
            evt.preventDefault();
            deferredInstallPrompt = evt;

            if (promptButton) {
                promptButton.hidden = false;
            }

            showIfTouchDevice();
        });

        ownerWindow.addEventListener('appinstalled', hide);

        if (closeButton) {
            closeButton.addEventListener?.('click', function () {
                ownerStorage.setItem(dismissedStorageKey, '1');
                hide();
            });
        }

        if (promptButton) {
            promptButton.addEventListener?.('click', function () {
                if (!deferredInstallPrompt) {
                    return;
                }

                deferredInstallPrompt.prompt();
                deferredInstallPrompt.userChoice.finally(function () {
                    deferredInstallPrompt = null;
                    if (promptButton) {
                        promptButton.hidden = true;
                    }
                });
            });
        }
    }

    function updateInstructionText() {
        if (!promptTextElement) {
            return;
        }

        if (isIOS()) {
            promptTextElement.textContent = 'SHARE - ADD TO HOME SCREEN';
            return;
        }

        promptTextElement.textContent = 'MENU - INSTALL APP';
    }

    function showIfTouchDevice() {
        if (
            !promptElement ||
            !isTouchDevice() ||
            isStandalone() ||
            wasDismissed()
        ) {
            return;
        }

        promptElement.hidden = false;
        promptElement.classList.add('is-visible');
        ownerDocument.body.classList.add('install-prompt-visible');
    }

    function hide() {
        if (!promptElement) {
            return;
        }

        promptElement.classList.remove('is-visible');
        promptElement.hidden = true;
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

    ownerDocument.addEventListener('DOMContentLoaded', init);

    return {
        hide
    };
}

export const InstallPrompt =
    typeof document === 'undefined' || typeof window === 'undefined'
        ? {
              hide() {}
          }
        : createInstallPrompt();
