var app4 = new Vue({
    el: '#app_mobile_iframe',
    data: {
        line: "L7",
        color: "",

        lastStationId: "-1",
        currentStationId: "-1",
        assertsPath: "./assets/",
        normalRadius: 6,
        selectedRadius: 8,
        favouredStation: "-1",

        trainType: {
            "0": "普通车",
            "1": "小交路车",
            "2": "大站快车",
            "3": "直达快车",
            "4": "出入库车",
        },
        direction: false,   //是否为上行, 默认为下行

        trainSchedules: undefined,
        stations: new Map(),
        trains: new Map(),
        trainPosition: new Map(),

        firstPos: 15,
        perSegment: 100,
        currentTrainId: "-1",
        updatePeriod: 5000
    },
    created() {
        this.init();
        setInterval(() => {
            this.loadTrains();
            this.updateStationSchedule(this.currentStationId);
        }, 5000);
        setInterval(() => {
            if (this.currentTrain != "-1") {
                this.showTrainInfo(this.currentTrain);
            }
        }, 5000);
    },
    mounted() {
        window.reverseDirection = this.reverseDirection;
        window.switchLine = this.switchLine;
    },
    methods: {
        init() {
            let vm = this;
            window.addEventListener('message', function (e) {
                vm.load(e.data);
            });
        },

        showTrainInfo(trainId) {
            //关闭正在展示的详情
            if (this.currentTrainId !== "-1") {
                this.trains.get(this.currentTrainId).isShowDetail = false;
                this.$forceUpdate();
                console.log(trainId == this.currentTrainId);
                if (trainId == this.currentTrainId) {
                    this.currentTrainId = "-1";
                    return;
                }
            }
            this.currentTrainId = trainId;
            let trainData = this.trains.get(trainId);

            trainData.type = this.formatTrainDescription(trainData);
            trainData.terminal = this.formatTrainTerminal(trainData).name;
            let terminalInfo = this.getTrainDataOfStation("-1", trainId);
            trainData.terminalTime = myTime.formatTime(terminalInfo.arrivalTime);

            let nextInfo = this.getNextStationInfo(trainId);
            console.log('下一站信息');
            console.log(nextInfo);
            trainData.nextStop = this.stations.get(nextInfo.stationId.toString()).name;
            trainData.arriveNextTime = nextInfo.arrivalTime;

            if (typeof (trainData.isShowDetail) == "undefined" || !trainData.isShowDetail) {
                trainData.isShowDetail = true;
                this.$forceUpdate();
            }
        },


        //第一次加载
        load(line) {
            this.line = line;
            this.reset();
            axios.get(this.assertsPath + 'lineInfo/' + line + '.json').then(res => {
                let names = res.data.stations;
                this.direction = false;

                for (let i = 0; i < names.length; i++) {
                    this.stations.set(
                        i + "",
                        {
                            "stationId": i,
                            "name": names[i],
                            "radius": 5,
                            "color": "#FFFFFF",
                            "strokeWidth": 0,
                            "trains": []
                        }
                    );
                }
                this.color = res.data.color;
                this.initFavouredStation();

                // 加载列车车次
                this.loadTrainSchedules(this.line).then(() => {
                    this.loadTrains();
                });
            }, () => {
                console.log('Load ' + url + ' Error!');
            });
        },

        async loadTrainSchedules(line) {
            let url = this.assertsPath + 'timetable/' + line + '/'
            if (this.isWorkDay()) {
                url += 'workday/' + line + '-train-schedule.json'
            } else {
                url += 'restday/' + line + '-train-schedule.json'
            }
            await axios.get(url).then(res => {
                this.trainSchedules = res.data;
            });
        },



        addTrainPosition(position, trainId) {
            position = position.toString();
            if (!this.trainPosition.has(position)) {
                this.trainPosition.set(position, [])
            }
            this.trainPosition.get(position).push(trainId);
        },


        loadTrains() {
            console.log('Loading trains...');
            //1.判断是否已加载所有列车的时刻表
            if (typeof (this.trainSchedules) === "undefined") {
                console.log("列车时刻表未加载");
                return;
            }

            let scheduleArray = Object.values(this.trainSchedules)
            //筛选出上/下行方向的列车
            const selectDirection = num => {
                if (this.direction) {
                    return num % 2 == 1
                } else {
                    return num % 2 == 0
                }
            }

            let now = new Date().format('HH:mm:ss');
            console.log('now:' + now);
            //当前在线运营的列车：符合 "始发站到达时间 <= 当前时间 <= 终点站离开时间" 条件的列车
            let onServiceTrains = scheduleArray
                .filter(element => selectDirection(element.direction))
                .filter(element => now <= element.schedule[element.schedule.length - 1].departTime)
                .filter(element => now >= element.schedule[0].arrivalTime)
            console.log('当前在线列车:');
            console.log(onServiceTrains);

            //记录在线运营列车的车次，用于删除this.trains中过时的列车
            let onServiceTrainNumbers = new Map();
            //更新this.trainPosition
            this.trainPosition.clear();
            //计算每列车的当前位置
            onServiceTrains.forEach(train => {
                onServiceTrainNumbers.set(train.trainId, '');
                train.position = this.calcTrainPosition(train);
                train.positionInView = this.calcTrainPositionInView(train.position);
                this.addTrainPosition(train.position, train.trainId)
                //把在运营的列车放入this.trains
                this.trains.set(train.trainId, train)
            });
            console.log('当前列车位置');
            console.log(this.trainPosition);
            //删除this.trains中在onServiceTrainNumbers没有的车次
            for (const trainId of this.trains.keys()) {
                if (!onServiceTrainNumbers.has(trainId)) {
                    console.log('trainId' + '退出运营');
                    this.trains.delete(trainId)
                }
            }

            //修改Map类型对象需要强制更新视图
            this.$forceUpdate();
            console.log('trains loaded.');
        },



        switchLine(line) {
            this.line = line;
            this.stations = new Map();
            this.load(line);
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
            if (this.favouredStation == "-1") {
                return;
            }
            let stationId = this.favouredStation;
            if (this.direction) {
                stationId = this.stations.size - 1 - stationId;
            }
            this.showStationInfo(stationId);
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

        resetStation() {
            this.lastStationId = "-1"
            this.currentStationId = "-1";
            this.stations.forEach((station) => {
                station.trains = [];
            });
        },

        reset() {
            this.resetStation();
            this.resetTrains();
            this.resetStationStyle();
        },

        resetTrains() {
            this.trains = new Map();
            this.currentTrain = "-1";
            this.trainPosition = new Map();
        },

        resetStationStyle() {
            if (this.lastStationId == "-1") {
                return;
            }
            this.stations.get(this.lastStationId).strokeWidth = 0;
            this.stations.get(this.lastStationId).radius = this.normalRadius;
        },

        //由父页面换向时调用, 实现本页面的切换上下行
        reverseDirection() {
            this.reset();

            this.direction = !this.direction;
            this.reverseStations();

            this.loadTrains();
            this.scrollToFavouredStation();
        },

        reverseStations() {
            this.stations = new Map(Array.from(this.stations).reverse());
            console.log(this.stations);
        },

        setStationStyle(stationId) {
            this.resetStationStyle();
            this.stations.get(stationId).radius = this.selectedRadius;
            this.stations.get(stationId).strokeWidth = 3;
        },

        showStationInfo(stationId) {
            this.lastStationId = this.currentStationId;
            this.setStationStyle(stationId);
            this.currentStationId = stationId;
            this.updateStationSchedule(stationId);
        },

        updateStationSchedule(stationId) {
            if (stationId == "-1") {
                return;
            }
            let trainList = this.getLatestTrains(stationId, 3);

            console.log(stationId + '站最近的列车');
            console.log(trainList);
            //暂无列车
            if (trainList.length < 1) {
                let t = {
                    "status": "等待发车",
                    "eta": "",
                    "terminal": "",
                    "description": ""
                }
                trainList.push(t);
            }

            trainList.forEach(trainData => {
                this.formatTrainData(trainData, stationId);
            });

            this.stations.get(stationId.toString()).trains = trainList;
        },


        formatTrainData(trainData, stationId) {
            if (typeof (trainData.schedule) == "undefined") {
                return;
            }
            trainData.status = this.formatTrainStatus(trainData);

            //判断是否为始发站
            const judgeFirstStop = (sid, tData) => {
                return Number(sid) == tData.schedule[0].stationId;
            }
            const isFirstStop = judgeFirstStop(stationId, trainData)
            trainData.eta = this.formatETA(trainData, isFirstStop);

            trainData.terminal = this.formatTrainTerminal(trainData).name;

            trainData.description = this.formatTrainDescription(trainData)
        },
        formatTrainTerminal(trainData) {
            let terminalId = trainData.schedule.slice(-1)[0].stationId;
            return this.stations.get(terminalId.toString());
        },

        formatTrainStatus(trainData) {
            let now = new Date().format('HH:mm:ss');
            if (now < trainData.arrivalTime) {
                let d1 = new Date('2023/01/01 ' + now);
                let d2;
                //凌晨0点到2点算为第2天
                if (trainData.arrivalTime <= '02:00:00') {
                    d2 = new Date('2023/01/02 ' + trainData.arrivalTime);
                } else {
                    d2 = new Date('2023/01/01 ' + trainData.arrivalTime);
                }
                //当前时间和到达时间相差的秒数
                let difference = parseInt(d2 - d1) / 1000
                if (difference <= 15) {
                    return '即将到站'
                } else {
                    let min = parseInt(difference / 60)
                    if (min === 0) {
                        min = 1;
                    }
                    return min + '分钟';
                }
            }
            else if (now >= trainData.arrivalTime && now <= trainData.departTime) {
                return '车已到站'
            } else if (now > trainData.departTime) {
                return '车已过站'
            }
        },
        formatETA(trainData, isFirstStop) {
            if (isFirstStop) {
                //始发站则显示出发时间
                trainData.description = '始发'
                return myTime.formatTime(trainData.departTime);
            }
            return myTime.formatTime(trainData.arrivalTime);
        },
        formatTrainDescription(trainData) {
            const trainType = this.trainType[trainData.level.toString()]

            if (trainType.includes('快')) {
                return trainType
            }
            return typeof (trainData.description) == "undefined" ? "" : trainData.description
        },


        //获取id为stationId车站最近number次列车
        getLatestTrains(stationId, number) {
            let trainList = [];
            const rawStationId = stationId;
            while (trainList.length < number) {
                stationId = stationId.toString();
                if (this.trainPosition.has(stationId)) {
                    const trains = this.trainPosition.get(stationId);
                    trains.forEach(element => {
                        //element: trainId
                        trainList.push(this.getTrainDataOfStation(rawStationId, element));
                    });
                }

                stationId = Number(stationId)

                stationId += this.direction ? 0.5 : -0.5
                if (stationId < 0 || stationId > this.stations.size - 1) {
                    //搜索完该站之前的列车即返回
                    break;
                }
            }
            trainList.sort((obj1, obj2) => { return obj1.arrivalTime - obj2.arrivalTime });
            //切片，trainList长度小于等于number
            return trainList.slice(0, number);
        },

        //获取trainId次列车stationId站的时刻
        getTrainDataOfStation(stationId, trainId) {
            if (typeof (this.trainSchedules[trainId]) == "undefined") {
                console.log('没有' + trainId + '次列车的数据');
            }
            if (stationId == "-1") {
                //查询终点站
                return this.trainSchedules[trainId].schedule.slice(-1)[0];
            }

            //对象使用 = 赋值 修改引用会改变原对象
            let trainData = Object.assign({}, this.trainSchedules[trainId]);

            const schedule = trainData.schedule.find(element => element.stationId === Number(stationId))
            trainData.departTime = schedule.departTime;
            trainData.arrivalTime = schedule.arrivalTime;
            return trainData;
        },

        isWorkDay() {
            let now = new Date();
            return !(now.getDay() === 0 || now.getDay() === 6);
        },

        //计算列车当前所在车站/区间
        calcTrainPosition(train) {
            let now = new Date().format('HH:mm:ss');
            for (let i = 0; i < train.schedule.length - 1; i++) {
                const departTime = train.schedule[i].departTime
                const arrivalTime = train.schedule[i].arrivalTime
                if (now >= arrivalTime && now <= departTime) {
                    //在当前站点
                    return train.schedule[i].stationId;
                } else if (now > departTime && now < train.schedule[i + 1].arrivalTime) {
                    //在当前站点与下一站之间
                    return (train.schedule[i + 1].stationId + train.schedule[i].stationId) / 2;
                }
            }
            //在终点站
            const terminalArrivalTime = train.schedule[train.schedule.length - 1].arrivalTime;
            const terminalDepartTime = train.schedule[train.schedule.length - 1].departTime;
            if (now >= terminalArrivalTime && now <= terminalDepartTime) {
                return train.schedule[train.schedule.length - 1].stationId;
            }
        },

        //计算列车在页面中的位置
        calcTrainPositionInView(position) {
            if (this.direction) {
                //上行
                return this.firstPos + this.perSegment * (this.stations.size -1 - position)
            } else {
                //下行
                return this.firstPos + this.perSegment * position
            }
        },

        //基于在线运营列车查询列车下一站信息
        getNextStationInfo(trainId) {
            if (!this.trains.get(trainId)) {
                console.log(trainId + '不在运营时间内');
            }
            let trainData = Object.assign({}, this.trains.get(trainId));
            let position = Number(trainData.position);
            const step = this.direction ? -0.5 : 0.5;
            const last = trainData.schedule.slice(-1)[0];

            if (position == last.stationId || (position + step) == last.stationId) {
                return last;
            }
            while (true) {
                position = Math.ceil(position + step)
                const nextInfo = trainData.schedule.find(element => element.stationId === position)
                //大站快车，不停靠的站点，继续查询下一站
                if (nextInfo.arrivalTime === "......") {
                    continue;
                }
                return nextInfo;
            }
        },
    }
})