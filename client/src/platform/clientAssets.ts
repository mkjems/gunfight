type ImageConstructor = new () => HTMLImageElement;

type ClientAssetsOptions = {
    Image?: ImageConstructor;
    createRockPattern: (image: HTMLImageElement) => CanvasPattern | null;
    onRockPatternLoaded?: (pattern: CanvasPattern | null) => void;
};

export function ClientAssets(options: ClientAssetsOptions) {
    const ImageCtor = options.Image || Image;
    const onRockPatternLoaded = options.onRockPatternLoaded || function () {};
    const createRockPattern = options.createRockPattern;
    const sprites = {
        cactus: new ImageCtor(),
        money: new ImageCtor(),
        rockPattern: new ImageCtor(),
        saloon: new ImageCtor(),
        wagon: new ImageCtor()
    };
    let rockPattern: CanvasPattern | null = null;

    function load() {
        sprites.wagon.src = 'images/wagon-1-4-37x38.png';
        sprites.cactus.src = 'images/cactus-1-4-17X32.png';
        sprites.money.src = 'images/money.png';
        sprites.saloon.src = 'images/saloon-64x128.png';
        sprites.rockPattern.onload = function () {
            rockPattern = createRockPattern(sprites.rockPattern);
            onRockPatternLoaded(rockPattern);
        };
        sprites.rockPattern.src = 'images/rock-pattern.png';
    }

    function getRockPattern() {
        return rockPattern;
    }

    return {
        getRockPattern,
        load,
        sprites
    };
}
