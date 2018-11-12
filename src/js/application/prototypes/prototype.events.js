Element.prototype.addMultipleListeners = function(callback) {
    if(arguments.length <= 1) {
        return false;
    }
    for(let i = 0; i < arguments.length - 1; i++){
        this.addEventListener(arguments[i], arguments[arguments.length - 1]);
    }
}