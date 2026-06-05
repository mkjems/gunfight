GF.Config = {
    canvas: {
        width: 950,
        height: 640
    },
    round: {
        resetDelay: 1800,
        gameOverDelay: 3000,
        seconds: 70,
        ammo: 6
    },
    player: {
        speed: 120,
        bounds: {
            minX: 64,
            maxX: 886,
            minY: 128,
            maxY: 630
        },
        hitBox: {
            offsetX: -30,
            offsetY: -112,
            width: 60,
            height: 104
        },
        animationFrameTime: 0.14,
        animationFrames: [0, 1, 2, 3],
        aimRows: {
            level: 0,
            raised: 1
        },
        sprite: {
            src: 'images/new2_gunfight_spritesheet.png',
            sourceWidth: 64,
            sourceHeight: 64,
            frameStride: 64,
            scale: 2
        },
        slots: [
            { x: 150, y: 430, facing: 1, frame: 0 },
            { x: 650, y: 430, facing: -1, frame: 2 },
            { x: 260, y: 260, facing: 1, frame: 1 },
            { x: 540, y: 260, facing: -1, frame: 3 }
        ]
    },
    bullet: {
        muzzle: {
            level: { x: 50, y: 28 },
            raised: { x: 48, y: 18 }
        },
        width: 18,
        height: 4,
        speed: 420
    },
    colors: {
        yellowRgb: [255, 255, 0],
        yellow: 'rgb(255,244,0)'
    }
};
