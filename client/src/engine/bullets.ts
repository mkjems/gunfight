import { Bullet } from './bullet.js';

type SceneLike = {
    addFigure: (figure: Bullet) => void;
};

type PlayerLike = ConstructorParameters<typeof Bullet>[0];
type BulletOptions = ConstructorParameters<typeof Bullet>[1];

export class Bullets {
    bullets: Record<string | number, Bullet>;
    scene: SceneLike;
    trackedBullets: Bullet[];

    constructor(scene: SceneLike) {
        this.scene = scene;
        this.bullets = {};
        this.trackedBullets = [];
    }

    fire(player: PlayerLike, options?: BulletOptions) {
        this.pruneInactiveBullets();
        const activeBullet = this.bullets[player.playerId];

        if (activeBullet && !activeBullet.deleteMe) {
            return false;
        }

        const bullet = new Bullet(player, options);
        this.bullets[player.playerId] = bullet;
        this.trackedBullets.push(bullet);
        this.scene.addFigure(bullet);
        return bullet;
    }

    remove(id: string | number) {
        if (!this.bullets[id]) {
            return;
        }

        this.bullets[id].deleteMe = true;
        delete this.bullets[id];
    }

    clear() {
        this.trackedBullets.forEach((bullet) => {
            bullet.deleteMe = true;
        });
        this.bullets = {};
        this.trackedBullets = [];
    }

    reset() {
        this.clear();
    }

    all() {
        this.pruneInactiveBullets();
        return this.bullets;
    }

    pruneInactiveBullets() {
        Object.keys(this.bullets).forEach((id) => {
            const bullet = this.bullets[id];

            if (bullet.deleteMe || bullet.isResting) {
                delete this.bullets[id];
            }
        });

        this.trackedBullets = this.trackedBullets.filter((bullet) => {
            return !bullet.deleteMe;
        });
    }
}
