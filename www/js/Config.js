GF.Config = {
    canvas: {
        width: 950,
        height: 640
    },
    graphics: {
        scale: 2
    },
    debug: {
        showCollisionBodies: false
    },
    game: {
        seconds: 70
    },
    round: {
        resetDelay: 1800,
        gameOverDelay: 5000,
        ammo: 6,
        introWalkDelay: 1500,
        getReadyDelay: 1200,
        drawDelay: 700,
        abandonedRequeueDelay: 2500
    },
    player: {
        speed: 120,
        animationFrameTime: 0.14,
        animationFrames: [0, 1, 2, 3],
        deathAnimation: {
            row: 9,
            frames: [0, 1, 2, 3],
            frameTime: 0.18
        },
        collider: {
            circles: [
                { x: -7, y: -28, radius: 4 },
                { x: 0, y: -40, radius: 6.5 },
                { x: 0, y: -29, radius: 7 },
                { x: 0, y: -18, radius: 5.5 }
            ],
            aimCircles: [
                { x: 10, y: -18, radius: 2.2 },
                { x: 12, y: -21, radius: 2.2 },
                { x: 14, y: -25, radius: 2.2 },
                { x: 15, y: -29, radius: 2.2 },
                { x: 15, y: -33, radius: 2.2 },
                { x: 15, y: -37, radius: 2.2 },
                { x: 14, y: -42, radius: 2.2 },
                { x: 12, y: -46, radius: 2.2 },
                { x: 10, y: -50, radius: 2.2 }
            ]
        },
        defaultAim: 4,
        aimLevels: [
            { row: 0, angleDegrees: 60, muzzle: { x: 49, y: 50 } },
            { row: 1, angleDegrees: 45, muzzle: { x: 52, y: 46 } },
            { row: 2, angleDegrees: 30, muzzle: { x: 54, y: 41 } },
            { row: 3, angleDegrees: 15, muzzle: { x: 55, y: 36 } },
            { row: 4, angleDegrees: 0, muzzle: { x: 55, y: 31 } },
            { row: 5, angleDegrees: -15, muzzle: { x: 55, y: 26 } },
            { row: 6, angleDegrees: -30, muzzle: { x: 54, y: 21 } },
            { row: 7, angleDegrees: -45, muzzle: { x: 52, y: 16 } },
            { row: 8, angleDegrees: -60, muzzle: { x: 49, y: 12 } }
        ],
        sprite: {
            src: 'images/gunfight_player_spritesheet.png',
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
