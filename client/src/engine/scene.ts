type Figure = {
    deleteMe?: boolean;
    draw(context: unknown): void;
    move(lastUpdated: number, now: number): void;
};

export class Scene {
    figures: Figure[];
    lastupdated: number | null;
    moveCount: number;

    constructor() {
        this.figures = [];
        this.moveCount = 0;
        this.lastupdated = null;
    }

    addFigure(point: Figure) {
        this.figures.push(point);
    }

    moveAll() {
        const t = new Date().getTime();

        if (!this.lastupdated) {
            this.lastupdated = t;
            return;
        }

        for (let i = this.figures.length - 1; i >= 0; i -= 1) {
            if (this.figures[i].deleteMe) {
                this.figures.splice(i, 1);
                continue;
            }
            this.figures[i].move(this.lastupdated, t);
        }
        this.moveCount += 1;
        this.lastupdated = t;
    }

    drawAll(context: unknown) {
        for (let i = 0; i < this.figures.length; i += 1) {
            if (this.figures[i].deleteMe) {
                continue;
            }
            this.figures[i].draw(context);
        }
    }
}
