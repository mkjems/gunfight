import { Config } from './config.js';

type AmmoHudContext = {
    drawImage: (
        sprite: AmmoHudSprite,
        x: number,
        y: number,
        width: number,
        height: number
    ) => void;
    fillRect: (x: number, y: number, width: number, height: number) => void;
    fillStyle: string;
    restore: () => void;
    save: () => void;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
};

type AmmoHudSprite = {
    complete?: boolean;
};

type AmmoHudRendererOptions = {
    context: AmmoHudContext;
    sprite?: AmmoHudSprite | null;
};

export class AmmoHudRenderer {
    context: AmmoHudContext;
    sprite?: AmmoHudSprite | null;

    constructor(options: AmmoHudRendererOptions) {
        this.context = options.context;
        this.sprite = options.sprite;
    }

    render(count: number, x: number, y: number, direction: number) {
        const scale = Config.graphics.scale;
        const spriteWidth = 7 * scale;
        const spriteHeight = 16 * scale;
        const spacing = 10 * scale;

        this.context.save();
        this.context.fillStyle = Config.colors.yellow;
        this.context.shadowColor = 'rgb(0,0,0)';
        this.context.shadowOffsetX = 3;
        this.context.shadowOffsetY = 3;

        for (let i = 0; i < count; i += 1) {
            const roundX = x + i * spacing * direction;

            if (this.sprite && this.sprite.complete) {
                this.context.drawImage(
                    this.sprite,
                    roundX,
                    y,
                    spriteWidth,
                    spriteHeight
                );
            } else {
                this.context.fillRect(roundX, y, spriteWidth, spriteHeight);
            }
        }

        this.context.restore();
    }
}
