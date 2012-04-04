
GF.Pen = function(x,y,color){
    this.x = x;
    this.y = y;
    this.size =  5;
    this.defaultColor = new GF.Color();
    this.defaultColor.randomDesignerColor();
    this.color = color || this.defaultColor;
}

GF.Pen.prototype = {
    draw: function(){
        context.beginPath();
        context.rect(this.x, this.y, this.size, this.size);        
        context.fillStyle = this.color.cssString(); //'rgb(0,255,255)';
        context.fill();
    }  
};