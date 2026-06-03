
GF.Pen = function(x,y,color){
    this.x = x;
    this.y = y;
    this.size =  5;
    this.color = color || new GF.Color();

    if(!color){
        this.color.randomDesignerColor();
    }
};

GF.Pen.prototype = {
    draw: function(context){
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);        
        context.fillStyle = this.color.cssString();
        context.fill();
    }  
};
