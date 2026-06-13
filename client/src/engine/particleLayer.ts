import { Config } from '../platform/config.js';

type Random = () => number;

type ParticleLayerOptions = {
    maxParticles?: number;
    random?: Random;
};

type Particle = {
    age: number;
    color: string;
    friction: number;
    gravity: number;
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
    colors: string[];
    count: number;
    direction?: number;
    friction?: number;
    gravity?: number;
    lifetime: [number, number];
    size: [number, number];
    speed: [number, number];
    spread: number;
    x: number;
    y: number;
};

const colors = {
    black: 'rgb(0,0,0)',
    darkYellow: 'rgb(126,116,0)',
    gray: 'rgb(86,86,86)',
    white: 'rgb(255,255,255)',
    yellow: Config.colors.yellow
};

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
            const size = Math.max(1, Math.round(particle.size));

            context.fillStyle = particle.color;
            context.fillRect(
                Math.round(particle.x),
                Math.round(particle.y),
                size,
                size
            );
        });
    }

    spawnMuzzleFlash(source: ParticleSource) {
        this.spawnBurst({
            colors: [colors.yellow, colors.white, colors.darkYellow],
            count: 7,
            direction: getSourceDirection(source),
            friction: 0.82,
            gravity: 20,
            lifetime: [0.06, 0.14],
            size: [2, 5],
            speed: [45, 145],
            spread: Math.PI / 3,
            x: source.x,
            y: source.y
        });
    }

    spawnGunSmoke(source: ParticleSource) {
        this.spawnBurst({
            colors: [colors.gray, colors.black, colors.darkYellow],
            count: 4,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.9,
            gravity: -8,
            lifetime: [0.12, 0.28],
            size: [2, 4],
            speed: [8, 35],
            spread: Math.PI,
            x: source.x,
            y: source.y
        });
    }

    spawnRicochetSparks(source: ParticleSource) {
        this.spawnBurst({
            colors: [colors.yellow, colors.white, colors.black],
            count: 6,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.88,
            gravity: 42,
            lifetime: [0.12, 0.28],
            size: [2, 4],
            speed: [55, 190],
            spread: Math.PI * 0.85,
            x: source.x,
            y: source.y
        });
    }

    spawnRockChips(source: ParticleSource) {
        this.spawnBurst({
            colors: [colors.yellow, colors.darkYellow, colors.black],
            count: 5,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.9,
            gravity: 70,
            lifetime: [0.18, 0.38],
            size: [2, 5],
            speed: [35, 120],
            spread: Math.PI,
            x: source.x,
            y: source.y
        });
    }

    spawnObstacleHit(source: ParticleSource & { obstacleId?: string }) {
        const isCactus = source.obstacleId?.startsWith('cactus:');

        this.spawnBurst({
            colors: isCactus
                ? [colors.yellow, colors.darkYellow, colors.black]
                : [colors.yellow, colors.gray, colors.black],
            count: isCactus ? 8 : 10,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.9,
            gravity: 85,
            lifetime: [0.2, 0.42],
            size: [2, 5],
            speed: [35, 150],
            spread: Math.PI * 1.2,
            x: source.x,
            y: source.y
        });
    }

    spawnPlayerHit(source: ParticleSource) {
        this.spawnBurst({
            colors: [colors.yellow, colors.white, colors.black],
            count: 14,
            direction: getSourceDirection(source) + Math.PI,
            friction: 0.86,
            gravity: 95,
            lifetime: [0.18, 0.34],
            size: [2, 5],
            speed: [45, 180],
            spread: Math.PI * 1.4,
            x: source.x,
            y: source.y
        });
    }

    private spawnBurst(options: BurstOptions) {
        for (let index = 0; index < options.count; index += 1) {
            const direction =
                (options.direction || 0) +
                this.between(-options.spread / 2, options.spread / 2);
            const speed = this.between(options.speed[0], options.speed[1]);

            this.addParticle({
                age: 0,
                color: this.pick(options.colors),
                friction: options.friction || 1,
                gravity: options.gravity || 0,
                lifetime: this.between(
                    options.lifetime[0],
                    options.lifetime[1]
                ),
                size: this.between(options.size[0], options.size[1]),
                vx: Math.cos(direction) * speed,
                vy: Math.sin(direction) * speed,
                x: options.x + this.between(-2, 2),
                y: options.y + this.between(-2, 2)
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

    private pick(values: string[]) {
        return values[
            Math.min(
                values.length - 1,
                Math.floor(this.random() * values.length)
            )
        ];
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
