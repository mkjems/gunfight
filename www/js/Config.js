GF.Config = {
    canvas: {
        width: 950,
        height: 640
    },
    graphics: {
        scale: 2
    },
    debug: {
        showCollisionBodies: true
    },
    round: {
        resetDelay: 1800,
        gameOverDelay: 3000,
        seconds: 70,
        ammo: 6,
        introWalkDelay: 1500,
        getReadyDelay: 1200,
        drawDelay: 700
    },
    player: {
        speed: 120,
        animationFrameTime: 0.14,
        animationFrames: [0, 1, 2, 3],
        collider: {
            circles: [
                { x: 15, y: -33, radius: 2.5 },
                { x: -7, y: -28, radius: 4 },
                { x: 0, y: -40, radius: 6.5 },
                { x: 0, y: -29, radius: 7 },
                { x: 0, y: -18, radius: 5.5 }
            ]
        },
        aimRows: {
            level: 0,
            raised: 1
        },
        sprite: {
            src: 'images/new2_gunfight_spritesheet.png',
            sourceWidth: 64,
            sourceHeight: 64,
            frameStride: 64,
            visibleBounds: {
                left: 21,
                right: 50,
                top: 14,
                bottom: 51
            },
            hitZone: {
                left: 24,
                right: 48,
                top: 16,
                bottom: 51
            }
        },
        slots: [
            { x: 150, y: 430, facing: 1, frame: 0 },
            { x: 800, y: 430, facing: -1, frame: 2 },
            { x: 260, y: 260, facing: 1, frame: 1 },
            { x: 540, y: 260, facing: -1, frame: 3 }
        ]
    },
    bullet: {
        muzzle: {
            level: { x: 50, y: 28 },
            raised: { x: 48, y: 18 }
        },
        width: 4,
        height: 4,
        speed: 420,
        fixedStep: 1 / 120
    },
    colors: {
        yellowRgb: [255, 255, 0],
        yellow: 'rgb(255,244,0)'
    }
};
