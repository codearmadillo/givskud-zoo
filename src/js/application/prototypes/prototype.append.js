Element.prototype.append = function()  {
    for(let i = 0; i < arguments.length; i++) {
        this.appendChild(arguments[i]);
    }
}
Element.prototype.prepend = function() {
    for(let i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
        this.innerHTML = arguments[i].outerHTML + this.innerHTML;
    }
}