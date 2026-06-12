import { ClientAppMount } from './clientApp.js';
import { createInstallPrompt } from './installPrompt.js';

type ClientUiOptions = {
    document: Document;
    localStorage?: Storage;
    onRenderRequest?: () => void;
    window?: Window;
};

export function create(options: ClientUiOptions) {
    const app = ClientAppMount.create({
        root: options.document.getElementById('appRoot')
    });
    const installPrompt = createInstallPrompt({
        document: options.document,
        localStorage: options.localStorage,
        onChange: options.onRenderRequest,
        window: options.window
    });

    return {
        app,
        installPrompt
    };
}

export const ClientUi = {
    create
};
