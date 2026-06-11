GF.Scene = function () {
    this.figures = [];
    this.moveCount = 0;
    this.lastupdated = null;
};

GF.Scene.prototype = {
    addFigure: function (point) {
        this.figures.push(point);
    },
    moveAll: function () {
        var t = new Date().getTime();
        if (!this.lastupdated) {
            this.lastupdated = t;
            return;
        }
        var i;
        for (i = this.figures.length - 1; i >= 0; i--) {
            if (this.figures[i].deleteMe) {
                this.figures.splice(i, 1);
                continue;
            }
            this.figures[i].move(this.lastupdated, t);
        }
        this.moveCount += 1;
        this.lastupdated = t;
    },
    drawAll: function (context) {
        var i;
        for (i = 0; i < this.figures.length; i++) {
            if (this.figures[i].deleteMe) {
                continue;
            }
            this.figures[i].draw(context);
        }
    }
};
