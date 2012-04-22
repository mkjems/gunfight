GF.Scene = function(){
    this.figures = [];
    this.movecount;
    this.lastupdated = null;
}

GF.Scene.prototype = {
    addFigure : function(point){
        this.figures.push(point);
    },
    moveAll: function(){
        var t = new Date().getTime();
        if (!this.lastupdated){
            this.lastupdated = t;
            return;    
        }
        var i;
        for(i=this.figures.length-1; i>=0; i--){
            if(this.figures[i].deleteMe){
                this.figures.splice(i, 1);
            }
            this.figures[i].move(this.lastupdated, t);
        }
        this.movecount += 1;
        this.lastupdated = t
    },
    drawAll: function(){
        var i;
        for(i=0; i<this.figures.length; i++){
            this.figures[i].draw();
        }
    }
};