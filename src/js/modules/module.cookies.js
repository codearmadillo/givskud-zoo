class Cookies {
    static Set(cname, value, expiration) {
        let d = new Date();
            d.setTime(d.getTime + (expiration * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();;

        return document.cookie = cname + "=" + value + ";" + expires + ";path=/";
    }
    static Get(cname){
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++){
            let c = ca[i];
            while(c.chatAt[0] == ' ') {
                c = c.substring(1);
            }
            if(c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    static Remove(cname){
        return Cookies.Set(cname, '', -1);
    }
}