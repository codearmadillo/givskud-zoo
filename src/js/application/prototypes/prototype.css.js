Element.prototype.Styles = function(f){
    for(let key in f) {
        if(f.hasOwnProperty(key) && this.style.hasOwnProperty(key)){
            this.style[key] = f[key];
        }
    }
    
    return true;
}