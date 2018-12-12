class Popup {
    constructor(d, cls = true) {
        this.dom = this.todom(d);
        this.cls = cls;
        return this.render();
    }
    todom(data) {
        var e = Array();

        data.forEach(function(c){
            var parsed = c.tag.split('@');

            var t = (parsed.length == 1) ? document.createElement(parsed) : (function(){
                let tag = document.createElement(parsed[0]);
                let attrs = parsed;
                    attrs.shift();

                attrs.forEach(function(attr){
                    let par = attr.split("=");
                    let pn = par[0];
                    let pv = par[1].replace(";", " ");

                    return tag.setAttribute(pn, pv);
                });

                return tag;
            })();

            var c = document.createTextNode(c.text);
                t.appendChild(c);

            return e.push(t);
        });

        return e;
    }
    render() {
        let Overlay = document.createElement("div");
            Overlay.className = "overlay__window";
        let PopupWindow = document.createElement("div");
            PopupWindow.className = "popup__content";
        let PopupOuter = document.createElement("div");
            PopupOuter.className = "popup__outer";
        if(this.cls) {
            PopupOuter.addEventListener('click', function(e){
                Overlay.remove();
            });
        }

        this.dom.forEach(function(e){
            PopupWindow.appendChild(e);
        });

        Overlay.append(
            PopupWindow,
            PopupOuter
        );

        return document.body.appendChild(Overlay);
    }
}