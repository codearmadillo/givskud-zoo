Element.prototype.Styles = function(f){
    for(let prop in f) {
        this.style[prop] = f[prop];
    }
    return this;
}
