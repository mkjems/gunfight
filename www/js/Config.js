GF.Config = {
    canvas: {
        width: 950,
        height: 640
    },
    round: {
        resetDelay: 1800
    },
    player: {
        speed: 120,
        bounds: {
            minX: 55,
            maxX: 895,
            minY: 130,
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
        sprite: {
            sourceWidth: 55,
            sourceHeight: 65,
            frameStride: 56,
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
        muzzleOffsetX: 54,
        muzzleOffsetY: -82,
        width: 18,
        height: 4,
        speed: 420
    },
    colors: {
        yellowRgb: [255, 255, 0],
        yellow: 'rgb(255,244,0)'
    }
};
