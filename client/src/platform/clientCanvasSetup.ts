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
    const particleCanvas = options.document.getElementById(
        'particleCanvas'
    ) as HTMLCanvasElement;
    const particleContext = particleCanvas.getContext(
        '2d'
    ) as CanvasRenderingContext2D;

    canvas.width = options.canvasConfig.width;
    canvas.height = options.canvasConfig.height;
    particleCanvas.width = options.canvasConfig.width;
    particleCanvas.height = options.canvasConfig.height;
    hudCanvas.width = options.canvasConfig.width;
    hudCanvas.height = options.canvasConfig.height;

    options.CanvasTools.disableImageSmoothing(context);
    options.CanvasTools.disableImageSmoothing(particleContext);
    options.CanvasTools.disableImageSmoothing(hudContext);

    return {
        canvas,
        context,
        hudCanvas,
        hudContext,
        particleCanvas,
        particleContext
    };
}

export const ClientCanvasSetup = {
    create
};
