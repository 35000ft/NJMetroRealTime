(function () {
    function setCookie(key, value, existedDays) {
        let exDate = new Date();//获取时间
        exDate.setTime(exDate.getTime() + 24 * 60 * 60 * 1000 * existedDays);//保存的天数
        document.cookie = key + "=" + value + ";path=/;expires=" + exDate.toGMTString();
    }

    function getCookie(key) {
        let name = key + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }
    window['cookie'] = {}
    window['cookie']['setCookie'] = setCookie;
    window['cookie']['getCookie'] = getCookie;

})();
