import { Color } from './color.js';

type DrawingContext = {
    beginPath: () => void;
    fill: () => void;
    fillStyle: string;
    rect: (x: number, y: number, width: number, height: number) => void;
};

export class Pen {
    color: Color;
    size: number;
    x: number;
    y: number;

    constructor(x: number, y: number, color?: Color) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.color = color || new Color();

        if (!color) {
            this.color.randomDesignerColor();
        }
    }

    draw(context: DrawingContext) {
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);
        context.fillStyle = this.color.cssString();
        context.fill();
    }
}
