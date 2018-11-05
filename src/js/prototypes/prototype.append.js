Element.prototype.append = function()  {
    for(let i = 0; i < arguments.length; i++) {
        this.appendChild(arguments[i]);
    }
}