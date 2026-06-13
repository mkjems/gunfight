import { Config } from '../platform/config.js';

type Random = () => number;

type ParticleLayerOptions = {
    maxParticles?: number;
    random?: Random;
};

type Particle = {
    age: number;
    friction: number;
    gravity: number;
    gridSize: number;
    lifetime: number;
    size: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
};

type ParticleSource = {
    facing?: number;
    speedX?: number;
    speedY?: number;
    x: number;
    y: number;
};

type ParticleRenderContext = {
    fillRect: (x: number, y: number, width: number, height: number) => void;
    fillStyle: string;
};

type BurstOptions = {
    count: number;
    direction?: number;
    friction?: number;
    gravity?: number;
    gridSize?: number;
    lifetime: [number, number];
    originJitter?: number;
    pixelSize?: number;
    speed: [number, number];
    spread: number;
    x: number;
    y: number;
};

const pixelColor = Config.colors.yellow;
const pixelUnit = Math.max(1, Config.graphics.scale || 1);
const defaultPixelSize = 3;

export class ParticleLayer {
    private readonly maxParticles: number;
    private readonly random: Random;
    private particles: Particle[];

    constructor(options: ParticleLayerOptions = {}) {
        this.maxParticles = options.maxParticles || 180;
        this.random = options.random || Math.random;
        this.particles = [];
    }

    clear() {
        this.particles = [];
    }

    count() {
        return this.particles.length;
    }

    update(deltaSeconds: number) {
        const delta = Math.max(0, Math.min(0.08, deltaSeconds || 0));

        for (let index = this.particles.length - 1; index >= 0; index -= 1) {
            const particle = this.particles[index];

            particle.age += delta;

            if (particle.age >= particle.lifetime) {
                this.particles.splice(index, 1);
                continue;
            }

            particle.vy += particle.gravity * delta;
            particle.vx *= Math.pow(particle.friction, delta * 60);
            particle.vy *= Math.pow(particle.friction, delta * 60);
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
        }
    }

    render(context: ParticleRenderContext) {
        this.particles.forEach(function (particle) {
            const size = snapBlockSize(particle.size);

            context.fillStyle = pixelColor;
            context.fillRect(
                snapToPixelGrid(particle.x, particle.gridSize),
                snapToPixelGrid(particle.y, particle.gridSize),
                size,
                size
            );
        });
    }

    spawnMuzzleFlash(source: ParticleSource) {
        this.spawnBurst({
            count: 6,
            direction: getSourceDirection(source),
            friction: 0.72,
            gravity: 8,
            gridSize: pixelUnit,
            lifetime: [0.07, 0.15],
            originJitter: 0,
            pixelSize: defaultPixelSize,
            speed: [80, 210],
            spread: Math.PI / 4,
            x: source.x,
            y: source.y
        });
    }

    spawnGunSmoke(source: ParticleSource) {
        this.spawnBurst({
            count: 3,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.82,
            gravity: -4,
            gridSize: pixelUnit,
            lifetime: [0.11, 0.24],
            originJitter: pixelUnit,
            pixelSize: defaultPixelSize,
            speed: [18, 58],
            spread: Math.PI * 0.7,
            x: source.x,
            y: source.y
        });
    }

    spawnRicochetSparks(source: ParticleSource) {
        this.spawnBurst({
            count: 5,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.76,
            gravity: 36,
            gridSize: pixelUnit,
            lifetime: [0.11, 0.26],
            originJitter: 0,
            pixelSize: defaultPixelSize,
            speed: [95, 250],
            spread: Math.PI * 0.55,
            x: source.x,
            y: source.y
        });
    }

    spawnRockChips(source: ParticleSource) {
        this.spawnBurst({
            count: 6,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.82,
            gravity: 82,
            gridSize: pixelUnit,
            lifetime: [0.18, 0.38],
            originJitter: pixelUnit,
            pixelSize: defaultPixelSize,
            speed: [55, 160],
            spread: Math.PI * 0.8,
            x: source.x,
            y: source.y
        });
    }

    spawnObstacleHit(source: ParticleSource & { obstacleId?: string }) {
        const isCactus = source.obstacleId?.startsWith('cactus:');

        this.spawnBurst({
            count: isCactus ? 7 : 9,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.84,
            gravity: 100,
            gridSize: pixelUnit,
            lifetime: [0.2, 0.42],
            originJitter: pixelUnit,
            pixelSize: defaultPixelSize,
            speed: [60, 185],
            spread: Math.PI,
            x: source.x,
            y: source.y
        });
    }

    spawnPlayerHit(source: ParticleSource) {
        this.spawnBurst({
            count: 11,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.8,
            gravity: 120,
            gridSize: pixelUnit,
            lifetime: [0.18, 0.36],
            originJitter: pixelUnit,
            pixelSize: defaultPixelSize,
            speed: [75, 230],
            spread: Math.PI * 1.1,
            x: source.x,
            y: source.y
        });
    }

    private spawnBurst(options: BurstOptions) {
        const gridSize = options.gridSize || pixelUnit;
        const pixelSize = snapBlockSize(options.pixelSize || defaultPixelSize);
        const originJitter =
            typeof options.originJitter === 'number'
                ? options.originJitter
                : gridSize;

        for (let index = 0; index < options.count; index += 1) {
            const direction =
                (options.direction || 0) +
                this.between(-options.spread / 2, options.spread / 2);
            const speed = this.between(options.speed[0], options.speed[1]);

            this.addParticle({
                age: 0,
                friction: options.friction || 1,
                gridSize,
                gravity: options.gravity || 0,
                lifetime: this.between(
                    options.lifetime[0],
                    options.lifetime[1]
                ),
                size: pixelSize,
                vx: Math.cos(direction) * speed,
                vy: Math.sin(direction) * speed,
                x: snapToPixelGrid(
                    options.x + this.between(-originJitter, originJitter),
                    gridSize
                ),
                y: snapToPixelGrid(
                    options.y + this.between(-originJitter, originJitter),
                    gridSize
                )
            });
        }
    }

    private addParticle(particle: Particle) {
        while (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        this.particles.push(particle);
    }

    private between(min: number, max: number) {
        return min + (max - min) * this.random();
    }
}

function getSourceDirection(source: ParticleSource) {
    if (
        typeof source.speedX === 'number' ||
        typeof source.speedY === 'number'
    ) {
        return Math.atan2(source.speedY || 0, source.speedX || 0);
    }

    return source.facing && source.facing < 0 ? Math.PI : 0;
}

function snapToPixelGrid(value: number, gridSize = pixelUnit) {
    return Math.round(value / gridSize) * gridSize;
}

function snapBlockSize(value: number) {
    return Math.max(1, Math.round(value));
}
