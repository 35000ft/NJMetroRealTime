var app3 = new Vue({
    el: '#app_mobile_iframe',
    data: {
        line: "S8",
        color: "",
        stations: [],
        lastStationId: -1,
        currentStationId: -1,
        assertsPath: "./assets/",
        normalRadius: 6,
        selectedRadius: 8,
        departTime: {
            down: { long: [], short: [], exDepot: [] },
            up: { long: [], short: [], exDepot: [] }
        },
        direction: false,   //是否为上行, 默认为下行
        trains: [],     //列车图标
        runtime: {
            down: [],
            up: []
        },
        terminal: {
            exDepot: -1,
            short: -1
        },
        firstPos: 15,
        perSegment: 100

    },
    created() {
        this.init();
        this.setTrainTime();
    },
    mounted() {
        window.reverseDirection = this.reverseDirection;
    },
    methods: {
        init() {
            let vm = this;
            window.addEventListener('message', function (e) {
                let names = e.data.names;
                for (i = 0; i < names.length; i++) {
                    vm.stations.push({
                        "index": i, "name": names[i], "radius": 5,
                        "color": "#FFFFFF", "trains": [], "strokeWidth": 0,
                        "timetable": undefined
                    });
                }
                vm.departTime = vm.isWorkDay() ? e.data.work : e.data.rest;
                vm.terminal = e.data.terminal;
                vm.runtime = e.data.runtime;
                vm.color = e.data.color;
                vm.loadTrain();
                setTimeout(() => {
                    setInterval(() => {
                        vm.loadTrain();
                    }, 10000);
                }, (10 - parseInt(new Date().getSeconds() % 10)) * 1000);
            })
        },

        resetStation() {
            this.lastStationId = -1
            this.currentStationId = -1;
            this.stations.forEach((station) => {
                station.trains = [];
            });
        },

        resetStationStyle() {
            if (this.lastStationId == -1) {
                return;
            }
            this.stations[this.lastStationId].strokeWidth = 0;
            this.stations[this.lastStationId].radius = this.normalRadius;
        },

        //由父页面换向时调用, 实现本页面的切换上下行
        reverseDirection() {
            this.resetStationStyle();
            this.resetStation();
            this.direction = !this.direction;
            this.stations.reverse();
            this.loadTrain();
        },

        setStationStyle(index) {
            this.resetStationStyle();
            this.stations[index].radius = this.selectedRadius;
            this.stations[index].strokeWidth = 3;
        },

        getStationInfo(index) {
            this.lastStationId = this.currentStationId;
            this.setStationStyle(index);
            this.currentStationId = index;
            if (typeof (this.stations[index].timetable) == "undefined") {
                //未加载本站的时刻表, 则加载时刻表
                this.stations[index].trains.push({ 'status': '加载中...', 'eta': 'Loading...' });
                console.log(index);
                let stationId = this.fillZero(index + 1);
                console.log("loading " + this.line + stationId + '.json');
                let fileName = this.assertsPath + 'timetable/' + this.line + stationId + '.json';
                this.loadTimeTable(fileName).then(res => {
                    this.stations[index].timetable = res;
                });
            }
        },

        setTrainTime() {
            setInterval(() => {
                if (this.currentStationId == -1) {
                    return;
                }
                let index = this.currentStationId;
                this.stations[index].trains = [];
                if (typeof (this.stations[index].timetable) == "undefined") {
                    //时刻表未加载
                } else {
                    const timetable = this.stations[index].timetable;
                    this.stations[index].trains = this.getLatestTrainTime(timetable, 3);
                }
            }, 3000);
        },

        getLatestTrainTime(timetable, trainNum) {
            let _timetable = this.getStationTimeTable(timetable);
            let _now = this.getFormatTime();
            //获取当前时间在时刻表的位置
            let currentIndex = this.getCurrentIndex(_timetable, _now);
            if (currentIndex === -1 || currentIndex === _timetable.length) {
                //已过末班
                return { "status": "停止服务", "eta": "Out Of Service" };
            }

            trains = [];
            for (i = 0; i < trainNum; i++) {
                _t = _timetable[currentIndex + i];
                train = {};
                console.log(i + ':' + _t);
                if (typeof (_t) == "undefined") {
                    continue;
                }
                train['eta'] = _t;
                let nowtime = new Date();
                let remainMin = this.calcRemainMins(_now, _timetable[currentIndex + i]);
                if (remainMin > 0) {
                    train['status'] = this.calcRemainMins(_now, train['eta']) + '分钟';
                } else if (remainMin == 0) {
                    if (nowtime.getSeconds() < 15) {
                        train['status'] = "即将到达";
                    } else {
                        train['status'] = "车已到站";
                    }
                }
                trains.push(train);
            }
            return trains;
        },

        async loadTimeTable(url) {
            let data = await axios.get(url).then(res => {
                return res.data;
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
            return data;
        },

        getStationTimeTable(timetable) {
            if (this.isWorkDay()) {
                return this.direction ? timetable.up_workday : timetable.down_workday;
            } else {
                return this.direction ? timetable.up_weekend : timetable.down_weekend;
            }
        },

        getDeptTimeTable(type, timetable) {
            switch (type) {
                case 0:
                    return this.direction ? timetable.up.long : timetable.down.long;
                case 1:
                    return this.direction ? timetable.up.short : timetable.down.short;
                case 2:
                    return this.direction ? timetable.up.exDepot : timetable.down.exDepot;
            }
        },

        getDepartTime(data) {
            return this.isWorkDay() ? data.work : data.rest;
        },

        isWorkDay() {
            let nowtime = new Date();
            if (nowtime.getDay() === 0 || nowtime.getDay() === 6) {
                return false;
            }
            return true;
        },

        getStartPos(type) {
            if (this.direction) {
                return this.firstPos + (this.stations.length - 1) * this.perSegment;
            } else {
                switch (type) {
                    case 0: return this.firstPos;
                    //返回小交路终点的位置
                    case 1: return this.firstPos + this.terminal.short * this.perSegment;
                    //返回出库车载客起点的位置
                    case 2: return this.firstPos + this.terminal.exDepot * this.perSegment;
                }
            }
        },

        //pre 15:36 pre 15:48 return 12
        calcRemainMins(pre, late) {
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
        },

        calcTrainPosition(type, departTime, runtime,) {
            if (!this.direction) {
                switch (type) {
                    case 0: break;
                    case 1: departTime = this.timeConvertor(departTime, -runtime[this.terminal.short]); break;
                    case 2: departTime = this.timeConvertor(departTime, -runtime[this.terminal.exDepot]); break;
                }
                // console.log(' down departTime:' + departTime);
            }
            // console.log('departTime2:' + departTime);
            let deviation = this.calcDeviationMins(departTime, this.getFormatTime());
            startPos = this.firstPos;
            if (deviation === runtime[runtime.length - 1]) {
                // console.log('pos1' + startPos + this.perSegment * (runtime.length - 1));
                return startPos + this.perSegment * (runtime.length - 1);
            } else if (deviation > runtime[runtime.length - 1]) {
                return -1;
            }
            for (let i = 0; i < runtime.length - 1; i++) {
                if (deviation > runtime[i] && deviation < runtime[i + 1]) {
                    // console.log('pos2:' + (startPos + this.perSegment * (i + 0.5)));
                    return startPos + parseInt(this.perSegment * (i + 0.5));
                } else if (deviation === runtime[i]) {
                    // console.log('pos3:' + (startPos + this.perSegment * i));
                    return startPos + this.perSegment * i;
                }
            }
        },

        // calcRemainMins(pre, late)
        calcDeviationMins(pre, late) {
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
        },

        loadTrain() {
            console.log('loading tarins...');
            let now = this.getFormatTime();
            let timetable;
            this.trains = [];
            for (let i = 0; i < 3; i++) {
                timetable = this.getDeptTimeTable(i, this.departTime);
                let currentIndex = this.getCurrentIndex(timetable, now);

                let runtime = this.direction ? this.runtime.up : this.runtime.down;
                let offset = this.getOffset(runtime, i);
                if (currentIndex > -1) {
                    //当前时间在首班车之后
                    let beginIndex = this.getCurrentIndex(timetable, this.timeConvertor(now, offset));
                    if (beginIndex >= timetable.length) {
                        //已过末班
                        console.log('已过末班');
                        continue;
                    }
                    if (typeof (timetable[currentIndex]) == "undefined" || now < timetable[currentIndex]) {
                        currentIndex -= 1;
                    }
                    for (let j = beginIndex; j <= currentIndex; j++) {
                        // console.log('departTime:' + timetable[j]);
                        this.trains.push(this.setTrain(i,
                            this.calcTrainPosition(i, timetable[j], runtime)));
                    }
                }
            }

        },

        //返回终点站在runtime中的位置
        getOffset(runtime, type) {
            switch (type) {
                case 0: return -runtime[runtime.length - 1];
                case 1: return this.direction ? -runtime[runtime.length - this.terminal.short - 1]
                    : -(runtime[runtime.length - 1] - runtime[this.terminal.short]);
                case 2: return this.direction ? -runtime[runtime.length - this.terminal.exDepot - 1]
                    : -(runtime[runtime.length - 1] - runtime[this.terminal.exDepot]);
            }
        },

        //缺陷:假定所有小交路终点站到另一端终点站都是下行 例如:方州广场-长江大桥北一定要是下行
        setTrain(type, position) {
            let train = {}
            train['position'] = position + 'px';
            train['type'] = type;
            switch (type) {
                //全交路车
                case 0: {
                    train['terminal'] = this.direction ? this.stations[0].name : this.stations[this.stations.length - 1].name;
                    break;
                }
                //小交路车
                case 1: train['terminal'] = this.direction ?
                    this.stations[this.terminal.short].name : this.stations[this.stations.length - 1].name; break;
                //this.terminal.short 小交路终点站

                //出库车
                case 2: train['terminal'] = this.direction ?
                    this.stations[this.terminal.exDepot].name : this.stations[this.stations.length - 1].name; break;
                //this.terminal.short 出库车载客始发站
                default:
                    train['terminal'] = "unknown";
            }
            return train;
        },

        getFormatTime() {
            let nowtime = new Date();
            let _h = nowtime.getHours()
            let _m = nowtime.getMinutes();
            if (_h < 10) {
                _h = '0' + _h;
            }
            if (_m < 10) {
                _m = '0' + _m;
            }
            return _h + ':' + _m;
        },

        //18:31 -> 17:59 offset=-32
        timeConvertor(_t, offset) {
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
            return this.fillZero(_h) + ':' + this.fillZero(_m);
        },

        fillZero(_t) {
            if (_t < 10) {
                return '0' + _t;
            }
            return _t.toString();
        },
        getCurrentIndex(_timetable, _t) {

            let start = 0;
            let end = _timetable.length;

            if (_t < _timetable[start]) {
                //如果当前时间在首班车前
                return -1;
            } else if (_t > _timetable[end - 1]) {
                //如果当前时间在末班车后
                return _timetable.length;
            }

            mid = parseInt((start + end) / 2);
            while (mid > start) {
                if (_t == _timetable[mid]) {
                    return mid;
                }
                else if (_t > _timetable[mid]) {
                    start = mid;
                }
                else {
                    //15:36 < 16:00
                    end = mid;
                }
                mid = parseInt((start + end) / 2);
            }
            //没有找到，返回_t以后的时间(较大的一个)
            return end;
        }
    },
})