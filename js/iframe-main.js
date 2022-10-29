var app3 = new Vue({
    el: '#app_mobile_iframe',
    data: {
        line: "",
        color: "",
        stations: [],
        lastStationId: -1,
        currentStationId: -1,
        assertsPath: "./assets/",
        normalRadius: 6,
        selectedRadius: 8,
        departTime: {
            "0": [],
            "1": [],
            "2": [],
            "3": [],
            "4": [],
            "5": [],
            "6": [],
            "7": [],
            "8": [],
            "9": []
        },
        direction: false,   //是否为上行, 默认为下行
        trains: [],     //列车图标
        runtime: {
            "0": [],
            "1": [],
            "2": [],
            "3": [],
            "4": [],
            "5": [],
            "6": [],
            "7": [],
            "8": [],
            "9": []
        },
        route: {
            "0": [],
            "1": [],
            "2": [],
            "3": [],
            "4": [],
            "5": [],
            "6": [],
            "7": [],
            "8": [],
            "9": []
        },
        terminal: {
            exDepot: -1,
            short: -1
        },
        firstPos: 15,
        perSegment: 100,

    },
    created() {
        this.init();
        this.setTrainTime();
    },
    mounted() {
        window.reverseDirection = this.reverseDirection;
        window.switchLine = this.switchLine;
    },
    methods: {
        switchLine(line) {
            this.line = line;
            this.reload(line);
        },

        reload(line) {
            const url = this.assertsPath + 'lineInfo/' + line + '.json';
            this.line = line;
            axios.get(url).then(res => {
                let names = res.data.stations;
                this.stations = [];
                this.direction = false;
                for (i = 0; i < names.length; i++) {
                    this.stations.push({
                        "index": i, "name": names[i], "radius": 5,
                        "color": "#FFFFFF", "trains": [], "strokeWidth": 0,
                        "timetable": undefined
                    });
                }
                this.route = res.data.route;
                this.runtime = res.data.runtime;
                this.color = res.data.color;
                this.loadTrain();
                this.initTimeTable();
                setTimeout(() => {
                    setInterval(() => {
                        this.loadTrain();
                    }, 10000);
                }, (10 - parseInt(new Date().getSeconds() % 10)) * 1000);
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        },
        init() {
            let vm = this;
            window.addEventListener('message', function (e) {
                vm.reload(e.data);
                // vm.line = e.data.line;
                // let names = e.data.stations;
                // for (i = 0; i < names.length; i++) {
                //     vm.stations.push({
                //         "index": i, "name": names[i], "radius": 5,
                //         "color": "#FFFFFF", "trains": [], "strokeWidth": 0,
                //         "timetable": undefined
                //     });
                // }
                // vm.route = e.data.route;
                // vm.runtime = e.data.runtime;
                // vm.color = e.data.color;
                // vm.loadTrain();
                // vm.initTimeTable();
                // setTimeout(() => {
                //     setInterval(() => {
                //         vm.loadTrain();
                //     }, 10000);
                // }, (10 - parseInt(new Date().getSeconds() % 10)) * 1000);
            })
        },

        async initTimeTable() {
            for (let i = 0; i < this.stations.length; i++) {
                let index = this.stations[i]['index'];
                this.stations[i]['timetable'] = await this.loadTimeTable(index);
            }
        },

        async initDeptTime(route) {
            for (let i = this.direction ? 1 : 0; i < 10; i += 2) {
                if (route[i.toString()].length < 1) {
                    continue;
                }
                let deptStationId = route[i.toString()][0];//Number

                await this.loadTimeTable(deptStationId).then((res) => {
                    this.stations[deptStationId].timetable = res;
                    this.departTime[i.toString()] = res[i.toString()];
                });
            }
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

        getStationFileName(index) {
            let stationId = this.fillZero(index + 1);
            let dir = this.assertsPath + 'timetable/' + this.line + '/';
            if (this.isWorkDay()) {
                return dir + 'workday/' + this.line + stationId + '.json';
            } else {
                return dir + 'restday/' + this.line + stationId + '.json';
            }
        },

        getStationInfo(index) {
            this.lastStationId = this.currentStationId;
            this.setStationStyle(index);
            this.currentStationId = index;

            this.loadTimeTable(this.stations[index]['index']).then(res => {
                this.stations[index].timetable = res;
            });
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

        parseTrainType(_type) {
            let terminalStation = this.stations.find(item => item['index'] === this.route[_type].slice(-1)[0]);
            switch (_type) {
                case "4": return "大站快车";
                case "5": return "大站快车";
                case "6": return "贯通/直达快车";
                case "7": return "贯通/直达快车";
                default: return terminalStation['name'];
            }
        },

        parseTrainStatus(_trainTime) {
            let remainMin = this.calcDeviationMins(this.getFormatTime(), _trainTime);
            if (remainMin > 0) {
                return remainMin + '分钟';
            } else if (remainMin == 0) {
                if (new Date().getSeconds() < 15) {
                    return "即将到达";
                } else {
                    return "车已到站";
                }
            }
        },

        getLatestTrainTime(timetable, trainNum) {
            //获取最近n列车的到达时间
            let trainsData = this.getLatestTrainData(timetable, trainNum);
            if (trainsData.length < 1) {
                //已过末班
                return [{ "status": "停止服务", "eta": "Out Of Service", "terminal": "" }];
            }
            let trains = [];
            trainsData.forEach((trainData) => {
                let train = {}
                train['eta'] = trainData["time"];
                train['status'] = this.parseTrainStatus(trainData['time'])
                train['type'] = this.parseTrainType(trainData['type']);
                // console.log(train);
                trains.push(train);
            })
            return trains;
        },

        async loadTimeTable(index) {
            //index 车站的真实id
            let timetable = this.stations.find(item => item['index'] === index).timetable;
            if (typeof (timetable) == "undefined") {
                //未加载本站的时刻表, 则加载时刻表
                console.log("loading " + this.getStationFileName(index));
                this.stations[index].trains.push({ 'status': '加载中...', 'eta': 'Loading...' });
                let data = await axios.get(this.getStationFileName(index)).then(res => {
                    return res.data;
                })
                return data;
            } else {
                return timetable;
            }
        },

        getLatestTrainData(timetable, trainNum) {
            let results = [];
            for (let i = this.direction ? 1 : 0; i < Object.keys(timetable).length; i += 2) {
                let _timetable = timetable[i.toString()];//时间数组
                if (_timetable.length == 0) {
                    continue;
                }
                //想要查看任意时刻修改这条语句，如 this.getFormatTime()改成"15:02"
                let currentIndex = this.getCurrentIndex(_timetable, this.getFormatTime());
                _t = _timetable.slice(currentIndex, currentIndex + trainNum);
                if (_t.length < 1) {
                    continue;
                }
                _t.forEach((item) => {
                    results.push({ "time": item, "type": i.toString() });
                });
            }
            results.sort((obj1, obj2) => {
                return obj1["time"].localeCompare(obj2["time"]);
            });
            console.log(results);
            return results.slice(0, trainNum);//截取最近的n班车
        },

        isWorkDay() {
            let nowtime = new Date();
            if (nowtime.getDay() === 0 || nowtime.getDay() === 6) {
                return false;
            }
            return true;
        },

        calcInitPosition(type) {
            let startStationId = this.route[type][0];
            if (!this.direction) {
                //下行
                return this.firstPos + startStationId * this.perSegment;
            } else {
                return this.firstPos + (this.stations.length - startStationId - 1) * this.perSegment;
            }
        },


        calcTrainPosition(type, departTime, runtime) {

            let deviation = this.calcDeviationMins(departTime, this.getFormatTime());

            //列车初始位置
            let startPos = this.calcInitPosition(type);

            if (deviation == runtime.slice(-1)[0]) {
                // console.log('pos1' + startPos + this.perSegment * (runtime.length - 1));
                return startPos + this.perSegment * (runtime.slice(-1)[0]);
            } else if (deviation > runtime.slice(-1)[0]) {
                return -1;
            }
            for (let i = 0; i < runtime.length - 1; i++) {
                if (deviation > runtime[i] && deviation < runtime[i + 1]) {
                    // console.log('pos2:' + (startPos + this.perSegment * (i + 0.5)));
                    return startPos + parseInt(this.perSegment * (i + 0.5));
                } else if (deviation == runtime[i]) {
                    // console.log('pos3:' + (startPos + this.perSegment * i));
                    return startPos + this.perSegment * i;
                }
            }
        },

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
            this.initDeptTime(this.route).then(() => {
                let now = this.getFormatTime();
                this.trains = [];
                for (let i = this.direction ? 1 : 0; i < 10; i += 2) {
                    let timetable = this.departTime[i.toString()];
                    // console.log('tt');
                    // console.log(timetable)
                    let runtime = this.runtime[i.toString()];
                    if (now < timetable[0]) {
                        //首班未发
                        continue;
                    }
                    let beginIndex = this.getCurrentIndex(timetable, this.timeConvertor(now, -runtime.slice(-1)[0]));
                    let currentIndex = this.getCurrentIndex(timetable, now);
                    if (beginIndex >= timetable.length) {
                        //已过末班
                        continue;
                    }
                    if (typeof (timetable[currentIndex]) == "undefined" || now < timetable[currentIndex]) {
                        currentIndex -= 1;
                    }
                    //加载上线列车
                    for (let j = beginIndex; j <= currentIndex; j++) {
                        this.trains.push(this.setTrain(i.toString(),
                            this.calcTrainPosition(i, timetable[j], runtime)));
                    }
                }
            });
        },

        setTrain(type, position) {
            let train = {}
            train['position'] = position + 'px';
            train['type'] = this.parseTrainType(type);
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
                return 0;
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
    }
})