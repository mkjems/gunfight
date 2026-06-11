GF.ClientCanvasSetup = (function () {
    function create(options) {
        var canvas = options.document.getElementById('canvas');
        var context = canvas.getContext('2d');
        var hudCanvas = options.document.getElementById('hudCanvas');
        var hudContext = hudCanvas.getContext('2d');

        canvas.width = options.canvasConfig.width;
        canvas.height = options.canvasConfig.height;
        hudCanvas.width = options.canvasConfig.width;
        hudCanvas.height = options.canvasConfig.height;

        options.CanvasTools.disableImageSmoothing(context);
        options.CanvasTools.disableImageSmoothing(hudContext);

        return {
            canvas: canvas,
            context: context,
            hudCanvas: hudCanvas,
            hudContext: hudContext
        };
    }

    return {
        create: create
    };
})();
