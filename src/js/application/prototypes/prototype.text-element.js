HTMLDocument.prototype.createTextElement = function(tagName, textContent) {
    let p = document.createElement(tagName);
    let c = document.createTextNode(textContent);

    p.appendChild(c);
    return p;
}