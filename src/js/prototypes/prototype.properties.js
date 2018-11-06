Element.prototype.Properties = function(f){
    for(let key in f) {
        this[key] = f[key];
    }
    
    return true;
}