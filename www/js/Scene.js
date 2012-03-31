function Scene(){
    this.figures = [];
    this.movecount;
}

Scene.prototype = {
    addFigure : function(point){
        this.figures.push(point);
    },
    moveAll: function(){
        var i;
        for(i=this.figures.length-1; i>=0; i--){
            this.figures[i].move();
        }
        this.movecount += 1;
    },
    drawAll: function(){
        var i;
        for(i=0; i<this.figures.length; i++){
            this.figures[i].draw();
        }
    }
};