type CanvasConfig = {
    height: number;
    width: number;
};

type CanvasToolsLike = {
    disableImageSmoothing: (context: CanvasRenderingContext2D) => void;
};

type ClientCanvasSetupOptions = {
    CanvasTools: CanvasToolsLike;
    canvasConfig: CanvasConfig;
    document: Document;
};

export function create(options: ClientCanvasSetupOptions) {
    const canvas = options.document.getElementById(
        'canvas'
    ) as HTMLCanvasElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const hudCanvas = options.document.getElementById(
        'hudCanvas'
    ) as HTMLCanvasElement;
    const hudContext = hudCanvas.getContext('2d') as CanvasRenderingContext2D;

    canvas.width = options.canvasConfig.width;
    canvas.height = options.canvasConfig.height;
    hudCanvas.width = options.canvasConfig.width;
    hudCanvas.height = options.canvasConfig.height;

    options.CanvasTools.disableImageSmoothing(context);
    options.CanvasTools.disableImageSmoothing(hudContext);

    return {
        canvas,
        context,
        hudCanvas,
        hudContext
    };
}

export const ClientCanvasSetup = {
    create
};
