type ClientInputStartupOptions<TInputController> = {
    createInputController: () => TInputController;
    initTouchControls: () => void;
    inputController?: TInputController | null;
    startGameLoop: () => void;
};

export function start<TInputController>(
    options: ClientInputStartupOptions<TInputController>
) {
    let inputController = options.inputController;

    if (inputController) {
        return inputController;
    }

    inputController = options.createInputController();
    options.initTouchControls();
    options.startGameLoop();

    return inputController;
}

export const ClientInputStartup = {
    start
};
