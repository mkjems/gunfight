import { Bullet } from './bullet.js';

type SceneLike = {
    addFigure: (figure: Bullet) => void;
};

type PlayerLike = ConstructorParameters<typeof Bullet>[0];
type BulletOptions = ConstructorParameters<typeof Bullet>[1];

export class Bullets {
    bullets: Record<string | number, Bullet>;
    scene: SceneLike;

    constructor(scene: SceneLike) {
        this.scene = scene;
        this.bullets = {};
    }

    fire(player: PlayerLike, options?: BulletOptions) {
        const activeBullet = this.bullets[player.playerId];

        if (activeBullet && !activeBullet.deleteMe) {
            return false;
        }

        const bullet = new Bullet(player, options);
        this.bullets[player.playerId] = bullet;
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
        Object.keys(this.bullets).forEach((id) => {
            this.remove(id);
        });
    }

    reset() {
        this.bullets = {};
    }

    all() {
        return this.bullets;
    }
}
