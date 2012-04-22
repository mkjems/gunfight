
GF.Controllable = function(xpos, ypos){
    this.x = xpos || 100;
    this.y = ypos || 100;
    this.direction = 0; // 0 -> 2PI
    this.speed = 5; // pixels pr second.
    this.pen = new GF.Pen(this.x, this.y, new GF.Color(255,255,0) );

}

GF.Controllable.prototype = {

    move: function(){
    
    },
    
    calculateNewXy: function(){
        
    },
    
    respondToKeyEvent: function(key){ 
        if(key ==='j'){
           this.y += this.dist; // down    
        }
        if(key==='k'){
           this.y -= this.dist; // up    
        } 
        if(key==='h'){
           this.x -= this.dist; // down    
        }
        if(key==='l'){
           this.x += this.dist; // up    
        }
    },
    
    draw: function(){
        this.pen.x = this.x;
        this.pen.y = this.y;
        this.pen.draw();
    }
    
        
};


