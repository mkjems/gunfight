
function Color(r,g,b){
    this.r = r||0;
    this.g = g||0;
    this.b = b||0;
}

Color.prototype = {
    designerColors:[
        //[20,37,120],
        //[54,73,153],
        //[222,155,63], // orange
        [0,0,255],     // deep blue  
        [10,10,235],     // deep blue  
        //[112,18,241],  // deep purple
        //[129,1,141]  // magenta
        //[11,180,191],   // cyan
        [215,218,3]   // yellow
     ],
    randomDesignerColor: function(){
        var pick = Math.round(Math.random() * (this.designerColors.length -1) ); 
        console.log(this.designerColors.length, pick);
        this.r = this.designerColors[pick][0];
        this.g = this.designerColors[pick][1];
        this.b = this.designerColors[pick][2];
    },
    randomColor: function(){
        this.r = Math.ceil(Math.random()*255);
        this.g = Math.ceil(Math.random()*255);
        this.b = Math.ceil(Math.random()*255);
    },
    cssString: function(){
        return 'rgb('+this.r+','+this.g+','+this.b+')';
    }
};