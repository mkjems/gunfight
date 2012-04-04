
GF.Controllable = function(xpos, ypos){
    this.x = xpos || 100;
    this.y = ypos || 100;
    this.pen = new GF.Pen(this.x, this.y, new GF.Color(255,255,0) );
    this.dist = 5;   
}

GF.Controllable.prototype = {

    move: function(){
        if(keys.isDown('j')){
           this.y += this.dist; // down    
        }
        if(keys.isDown('k')){
           this.y -= this.dist; // up    
        } 
        if(keys.isDown('h')){
           this.x -= this.dist; // down    
        }
        if(keys.isDown('l')){
           this.x += this.dist; // up    
        }           
    },
    
    draw: function(){
        this.pen.x = this.x;
        this.pen.y = this.y;
        this.pen.draw();
    }
    
        
};


