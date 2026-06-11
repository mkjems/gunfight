GF.CanvasTools = (function () {
    function disableImageSmoothing(context) {
        context.imageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.mozImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
    }

    function createScaledPattern(options) {
        var image = options.image;
        var context = options.context;
        var scale = GF.Config.graphics.scale;
        var tile = options.document.createElement('canvas');
        var tileContext = tile.getContext('2d');

        tile.width = image.width * scale;
        tile.height = image.height * scale;
        disableImageSmoothing(tileContext);
        tileContext.drawImage(image, 0, 0, tile.width, tile.height);

        return context.createPattern(tile, 'repeat');
    }

    return {
        createScaledPattern: createScaledPattern,
        disableImageSmoothing: disableImageSmoothing
    };
})();
