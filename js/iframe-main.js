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
        favouredStation: -1,
        departTime: {
        },
        trainType: {
            "0": "普通车",
            "1": "普通车",
            "2": "普通车",
            "3": "普通车",
            "4": "大站快车",
            "5": "大站快车",
            "6": "直达快车",
            "7": "直达快车",
            "8": "普通车",
            "9": "普通车",
            "10": "普通车",
            "11": "普通车",
            "12": "普通车",
            "13": "普通车"
        },
        direction: false,   //是否为上行, 默认为下行
        trains: [],
        runtime: {
        },
        route: {

        },
        terminal: {
            exDepot: -1,
            short: -1
        },
        firstPos: 15,
        perSegment: 100,
        currentTrain: -1
    },
    created() {
        this.init();
        setInterval(() => {
            this.setTrainTime();
        }, 3000);
        setInterval(() => {
            if (this.currentTrain != -1) {
                this.showTrainInfo(this.currentTrain);
            }
        }, 5000);
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
        showTrainInfo(index) {
            this.displayTrainInfo(this.currentTrain);
            this.currentTrain = index;
            this.trains[index]['isShowDetail'] = true;
            let position = this.trains[index].position;
            position = parseInt(position.slice(0, position.length - 2));
            let nextStopId = this.getNextStop(position, this.trains[index].type);
            if (this.direction) {
                nextStopId = this.stations.length - 1 - nextStopId;
            }
            this.getStationInfo(nextStopId);
            this.trains[index].nextStop = this.stations[nextStopId].name;
            this.trains[index].arriveNextTime =
                this.getArriveNextStopTime(nextStopId, this.trains[index].type, this.trains[index].departTime);
        },
        displayTrainInfo(index) {
            if (index == -1) {
                return;
            }
            this.trains[index].isShowDetail = false;
            this.currentTrain = -1;
        },

        reload(line) {
            const url = this.assertsPath + 'lineInfo/' + line + '.json';
            this.line = line;
            this.resetStation();
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
                this.resetTrain();
                this.initFavouredStation();
                this.loadTrain();
                this.initTimeTable().then(() => {
                    setTimeout(() => {
                        setInterval(() => {
                            this.reloadTrain();
                        }, 10000);
                        setInterval(() => {
                            this.loadTrain();
                        }, 60000);
                    }, (10 - parseInt(new Date().getSeconds() % 10)) * 1000);
                });

            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        },

        init() {
            let vm = this;
            window.addEventListener('message', function (e) {
                vm.reload(e.data);
            });
        },

        async initTimeTable() {
            for (let i = 0; i < this.stations.length; i++) {
                if (typeof (this.stations.find(item => item.index === i).timetable) == "undefined") {
                    this.stations.find(item => item.index === i).timetable = await this.loadTimeTable(i);
                }
            }
        },

        initFavouredStation() {
            let station = cookie.getCookie(this.line);
            if (station == "") {
                this.favouredStation = -1;
                return;
            }
            this.favouredStation = station;
            this.scrollToFavouredStation();
        },

        scrollToFavouredStation() {
            if (this.favouredStation == -1) {
                return;
            }
            let stationId = this.favouredStation;
            if (this.direction) {
                stationId = this.stations.length - 1 - stationId;
            }
            this.getStationInfo(stationId);
            this.$nextTick(() => {
                let scrollY = stationId * 100;
                window.scrollTo(0, scrollY);
            })
        },


        favourStation(stationId) {
            if (this.favouredStation == stationId) {
                this.favouredStation = -1;
                cookie.setCookie(this.line, "", 90);
                return;
            }
            this.favouredStation = stationId;
            cookie.setCookie(this.line, stationId, 90);
        },

        async initDeptTime(route) {
            for (let i = this.direction ? 1 : 0; i < Object.keys(route).length; i += 2) {
                if (route[i.toString()].length < 1) {
                    continue;
                }
                let deptStationId = route[i.toString()][0];//Number
                let timetable = await this.getStationTimetable(deptStationId);
                this.departTime[i.toString()] = timetable[i.toString()];
            }
        },

        //id: 站点真实id
        async getStationTimetable(id) {
            let timetable = this.stations.find(item => item['index'] === id).timetable;
            if (typeof (timetable) == "undefined") {
                this.stations.find(item => item['index'] === id).timetable = await this.loadTimeTable(id);
            }
            return this.stations.find(item => item['index'] === id).timetable;
        },

        resetStation() {
            this.lastStationId = -1
            this.currentStationId = -1;
            this.stations.forEach((station) => {
                station.trains = [];
            });
        },

        resetTrain() {
            this.trains = [];
            this.currentTrain = -1;
            this.departTime = {};
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
            this.resetTrain();

            this.direction = !this.direction;
            this.stations.reverse();

            this.loadTrain();
            this.scrollToFavouredStation();
        },

        setStationStyle(index) {
            this.resetStationStyle();
            this.stations[index].radius = this.selectedRadius;
            this.stations[index].strokeWidth = 3;
        },

        getStationFileName(index) {
            let stationId = myTime.fillZero(index + 1);
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
            if (this.stations[index].trains.length < 1) {
                this.stations[index].trains = [{ 'status': '加载中...', 'eta': 'Loading...', 'type': '' }];
            }
            this.setTrainTime();
        },

        setTrainTime() {
            if (this.currentStationId == -1) {
                return;
            }
            let index = this.currentStationId;
            if (typeof (this.stations[index].timetable) == "undefined") {
                return;
            }
            const timetable = this.stations[index].timetable;
            this.stations[index].trains = this.getLatestTrainTime(timetable, 3);
        },

        parseTrainTerminal(_type) {
            let terminalStation = this.stations.find(item => item['index'] === this.route[_type].slice(-1)[0]);
            return terminalStation['name'];
        },

        parseTrainStatus(_trainTime) {
            let remainMin = myTime.calcDeviationMins(myTime.getCurrentTime(), _trainTime);
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
                return [{ "status": "停止服务", "eta": "Out Of Service", "terminal": "", "type": "" }];
            }
            let trains = [];
            trainsData.forEach((trainData) => {
                let train = {}
                train['eta'] = trainData["time"];
                train['status'] = this.parseTrainStatus(trainData['time'])
                train['type'] = trainData['type'];
                train['terminal'] = this.parseTrainTerminal(trainData['type']);
                trains.push(train);
            })
            return trains;
        },

        async loadTimeTable(index) {
            //index 车站的真实id
            console.log("loading " + this.getStationFileName(index));
            let data = await axios.get(this.getStationFileName(index)).then(res => {
                return res.data;
            });
            return data;
        },

        getLatestTrainData(timetable, trainNum) {
            let results = [];
            for (let i = this.direction ? 1 : 0; i < Object.keys(timetable).length; i += 2) {
                let _timetable = timetable[i.toString()];//时间数组
                if (_timetable.length == 0) {
                    continue;
                }
                let currentIndex = this.getCurrentTimeIndex(_timetable, myTime.getCurrentTime());
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
            if (this.direction) {
                return this.firstPos + (this.stations.length - startStationId - 1) * this.perSegment;
            } else {
                return this.firstPos + startStationId * this.perSegment;
            }
        },


        calcTrainPosition(type, departTime) {
            let runtime = this.runtime[type];//type: "1" "0"
            let deviation = myTime.calcDeviationMins(departTime, myTime.getCurrentTime());
            console.log('type:' + type + ' dev:' + deviation);
            //列车初始位置
            let startPos = this.calcInitPosition(type);

            if (deviation == runtime.slice(-1)[0]) {
                return startPos + this.perSegment * (this.stations.length - 1);
            } else if (deviation > runtime.slice(-1)[0]) {
                return -1;
            }
            for (let i = 0; i < runtime.length - 1; i++) {
                if (deviation > runtime[i] && deviation < runtime[i + 1]) {
                    return startPos + parseInt(this.perSegment * (i + 0.5));
                } else if (deviation == runtime[i]) {
                    return startPos + this.perSegment * i;
                }
            }
        },

        loadTrain() {
            console.log('loading tarins...');
            this.initDeptTime(this.route).then(() => {
                let now = myTime.getCurrentTime();
                let keys = Object.keys(this.departTime);
                keys.forEach((key) => {
                    let timetable = this.departTime[key];
                    if (timetable.length < 1 || now < timetable[0]) {
                        //首班未发
                        return;
                    }
                    let runtime = this.runtime[key];
                    let beginIndex = this.getCurrentTimeIndex(timetable, myTime.timeConvertor(now, -runtime.slice(-1)[0]));
                    let currentIndex = this.getCurrentTimeIndex(timetable, now);
                    if (beginIndex >= timetable.length) {
                        //已过末班
                        return;
                    }

                    if (this.trains.length > 0) {
                        //已存在列车, 之后监视是否有新发出的列车
                        let trains = this.trains.filter((train) => {
                            return train.type == key;
                        });
                        if (trains.length > 1) {
                            let lastDeptTime = trains.slice(-1)[0].departTime;
                            if (timetable[beginIndex] <= lastDeptTime) {
                                return;
                            }
                        }
                    }
                    if (typeof (timetable[currentIndex]) == "undefined" || now < timetable[currentIndex]) {
                        currentIndex -= 1;
                    }

                    //加载上线列车
                    for (let j = beginIndex; j <= currentIndex; j++) {
                        let departTime = timetable[j];

                        let terminalTime = this.getArriveTerminalTime(departTime, key);
                        let train = {
                            'position': this.calcTrainPosition(key, departTime) + 'px',
                            'type': key,
                            'terminal': this.parseTrainTerminal(key),
                            'terminalTime': terminalTime,
                            'departTime': departTime,
                            'isShowDetail': false
                        }
                        this.trains.push(train);
                    }
                })

            });
        },

        reloadTrain() {
            let nowTime = myTime.getCurrentTime();
            let timeoutTrains = [];
            this.trains.forEach((train, index) => {
                if (nowTime > train.terminalTime) {
                    timeoutTrains.push(index);
                } else {
                    train.position = this.calcTrainPosition(train.type, train.departTime) + 'px';
                    console.log(train.position);
                }
            });
            timeoutTrains.forEach(i => this.trains.splice(i, 1));
        },

        //获取列车的下一站的真实id
        getNextStop(position, type) {
            position -= this.firstPos;
            let remainder = (position) % this.perSegment;
            let current = Math.floor(position / this.perSegment);
            let next = Math.ceil(position / this.perSegment);
            if (this.trainType[type] == "普通车") {
                if (remainder != 0) {
                    return this.stations[next].index;
                } else {
                    return this.stations[current].index;
                }
            } else {
                //快车
                let result = this.route[type].find(item => item === current);
                if (remainder == 0 && typeof (result) != "undefined") {
                    return result;
                }
                let remainStations;
                if (this.direction) {
                    current = this.stations.length - 1 - current;
                    remainStations = this.route[type].filter((item) => {
                        return item < current;
                    });
                } else {
                    remainStations = this.route[type].filter((item) => {
                        return item > current;
                    });
                }

                console.log('rem');
                console.log(remainStations);
                return remainStations[0];
            }
        },

        getArriveNextStopTime(nextStopId, type, departTime) {
            if (this.trainType[type] == "普通车") {
                return this.stations[nextStopId].trains[0].status;
            } else {
                let remainMin = myTime.timeConvertor(departTime, this.runtime[type][nextStopId]);
                return this.parseTrainStatus(remainMin);
            }
        },

        getArriveTerminalTime(departTime, type) {
            let runtime = this.runtime[type].slice(-1)[0];
            return myTime.timeConvertor(departTime, runtime);
        },

        getCurrentTimeIndex(_timetable, _t) {
            return alg.binarySearch(_timetable, _t);
        }
    }
})