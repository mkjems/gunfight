
GF.Color = function (r,g,b){
    this.r = r||0;
    this.g = g||0;
    this.b = b||0;
};

GF.Color.prototype = {
    designerColors:[
        [0,0,255],     // deep blue  
        [10,10,235],     // deep blue  
        [215,218,3]   // yellow
     ],
    randomDesignerColor: function(){
        var pick = Math.round(Math.random() * (this.designerColors.length -1) ); 
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
