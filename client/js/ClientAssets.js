GF.ClientAssets = function (options) {
    options = options || {};

    var ImageCtor = options.Image || Image;
    var onAmmoLoaded = options.onAmmoLoaded || function () {};
    var onRockPatternLoaded = options.onRockPatternLoaded || function () {};
    var createRockPattern = options.createRockPattern;
    var sprites = {
        ammo: new ImageCtor(),
        cactus: new ImageCtor(),
        rockPattern: new ImageCtor(),
        saloon: new ImageCtor(),
        wagon: new ImageCtor()
    };
    var rockPattern = null;

    function load() {
        sprites.ammo.onload = onAmmoLoaded;
        sprites.ammo.src = 'images/bullet.png';
        sprites.wagon.src = 'images/wagon-1-4-37x38.png';
        sprites.cactus.src = 'images/cactus-1-4-17X32.png';
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
        getRockPattern: getRockPattern,
        load: load,
        sprites: sprites
    };
};
