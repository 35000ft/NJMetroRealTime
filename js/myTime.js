(function () {
    function timeConvertor(_t, offset) {
        _t = _t.split(':');
        _h = parseInt(_t[0]);
        _m = parseInt(_t[1]);
        //小时需要增减的量 _m + offset超出60的减 小于0的加
        hour_offset = Math.floor((_m + offset) / 60);
        _h += hour_offset;
        if (hour_offset === 0) {
            _m += offset;
        } else {
            _m = _m + offset + 60 * -hour_offset;
        }
        return fillZero(_h) + ':' + fillZero(_m);
    }

    function fillZero(time) {
        if (time < 10) {
            return '0' + time;
        }
        return time.toString();
    }

    function getCurrentTime() {
        return "21:00";
        let nowtime = new Date();
        let _h = nowtime.getHours()
        let _m = nowtime.getMinutes();
        if (_h < 10) {
            if (_h == 0) {
                _h = '24';
            } else {
                _h = '0' + _h;
            }
        }
        if (_m < 10) {
            _m = '0' + _m;
        }
        return _h + ':' + _m
    }
    function calcDeviationMins(pre, late) {
        if (typeof (pre) == "undefined" || typeof (late) == "undefined") {
            return;
        }
        h1 = parseInt(pre.split(':')[0]);
        m1 = parseInt(pre.split(':')[1]);
        h2 = parseInt(late.split(':')[0]);
        m2 = parseInt(late.split(':')[1]);
        if (h1 == h2) {
            return m2 - m1;
        } else {
            return m2 + 60 * (h2 - h1) - m1;
        }
    }


    window['myTime'] = {}
    window['myTime']['timeConvertor'] = timeConvertor;
    window['myTime']['fillZero'] = fillZero;
    window['myTime']['getCurrentTime'] = getCurrentTime;
    window['myTime']['calcDeviationMins'] = calcDeviationMins;

})();
