(function () {
    function timeConvertor(_t, offset) {

    }


    function formatTime(time) {
        let _t = time.split(':')
        let d;
        if (Number(_t[2]) >= 30) {
            d = new Date('2023/01/01 ' + _t[0] + ':' + _t[1] + ':00')
            d.setMinutes(d.getMinutes() + 1);
            return d.format('HH:mm')
        }
        d = new Date('2023/01/01 ' + _t[0] + ':' + _t[1] + ':' + _t[2])
        return d.format('HH:mm')
    }

    /**
     *
     * @param former:   Date
     * @param latter:   Date
     * @param unit: string 单位, 默认为s
     */
    function getDeviationTime(former, latter, unit = "s") {

    }

    Date.prototype.format = function (format) {
        let o = {
            "M+": this.getMonth() + 1, //月份 
            "d+": this.getDate(), //日 
            "H+": this.getHours(), //小时 
            "m+": this.getMinutes(), //分 
            "s+": this.getSeconds(), //秒 
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
            "S": this.getMilliseconds() //毫秒 
        };
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (const k in o)
            if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return format;
    }


    window['myTime'] = {}
    window['myTime']['timeConvertor'] = timeConvertor;
    window['myTime']['formatTime'] = formatTime;


})();
