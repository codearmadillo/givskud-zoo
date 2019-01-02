var Cookies = {
    get: function(cname) {
        let cookies = document.cookie.split(';');
            cookies = cookies.filter(function(c){
                return c.split("=")[0].trim() == cname;
            });

        return cookies.length > 0 ? cookies[0].split("=")[1] : null;
    },
    set: function(cname, cvalue, cdays) {
        let today = new Date();
            today.setTime(today.getTime() + (cdays * 24 * 60 * 60 * 1000));
        let exp = "expires=" + today.toUTCString();

        document.cookie = cname + "=" + cvalue + ";" + exp + ";path=/";

        return this.get(cname);
    },
    remove: function(cname) {
        return this.set(cname, "", -1) == null;
    }
}