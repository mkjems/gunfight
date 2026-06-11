import { Config } from './config.js';

type ImageSmoothingContext = {
    imageSmoothingEnabled?: boolean;
    webkitImageSmoothingEnabled?: boolean;
    mozImageSmoothingEnabled?: boolean;
    msImageSmoothingEnabled?: boolean;
};

type CreateScaledPatternOptions = {
    context: CanvasRenderingContext2D;
    document: Document;
    image: CanvasImageSource & {
        height: number;
        width: number;
    };
};

export function disableImageSmoothing(context: ImageSmoothingContext) {
    context.imageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
}

export function createScaledPattern(options: CreateScaledPatternOptions) {
    const image = options.image;
    const context = options.context;
    const scale = Config.graphics.scale;
    const tile = options.document.createElement('canvas');
    const tileContext = tile.getContext('2d');

    if (!tileContext) {
        throw new Error('Unable to create scaled pattern canvas context');
    }

    tile.width = image.width * scale;
    tile.height = image.height * scale;
    disableImageSmoothing(tileContext);
    tileContext.drawImage(image, 0, 0, tile.width, tile.height);

    return context.createPattern(tile, 'repeat');
}

export const CanvasTools = {
    createScaledPattern,
    disableImageSmoothing
};
