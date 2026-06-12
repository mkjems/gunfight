export class Color {
    b: number;
    designerColors: number[][];
    g: number;
    r: number;

    constructor(r?: number, g?: number, b?: number) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.designerColors = [
            [0, 0, 255],
            [10, 10, 235],
            [215, 218, 3]
        ];
    }

    randomDesignerColor() {
        const pick = Math.round(
            Math.random() * (this.designerColors.length - 1)
        );

        this.r = this.designerColors[pick][0];
        this.g = this.designerColors[pick][1];
        this.b = this.designerColors[pick][2];
    }

    randomColor() {
        this.r = Math.ceil(Math.random() * 255);
        this.g = Math.ceil(Math.random() * 255);
        this.b = Math.ceil(Math.random() * 255);
    }

    cssString() {
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
    }
}
