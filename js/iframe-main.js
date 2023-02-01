var app2 = new Vue({
    el: '#app_mobile_iframe',
    data: {
        line: "L1",
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
        updatePeriod: 5000,
        firstId: 0,
        lastId: 0
    },
    created() {
        this.init()
        setInterval(() => {
            this.loadTrains()
            this.updateStationSchedule(this.currentStationId)
        }, 5000)
        setInterval(() => {
            if (this.currentTrain !== "-1") {
                this.showTrainInfo(this.currentTrain)
            }
        }, 5000)
    },
    mounted() {
        window.reverseDirection = this.reverseDirection;
        window.switchLine = this.switchLine;
        window.switchLineSelf = this.switchLineSelf;
    },
    methods: {
        init() {
            let vm = this;
            window.addEventListener('message', function (e) {
                vm.load(e.data).then(() => {
                    vm.initFavouredStation()

                    // 加载列车车次
                    vm.loadTrainSchedules(vm.line).then(() => {
                        vm.loadTrains()
                    })
                })
            })
        },

        showTrainInfo(trainId) {
            //关闭正在展示的详情
            if (this.currentTrainId !== "-1") {
                this.trains.get(this.currentTrainId).isShowDetail = false;
                this.$forceUpdate()
                console.log(trainId === this.currentTrainId)
                if (trainId === this.currentTrainId) {
                    this.currentTrainId = "-1";
                    return;
                }
            }
            this.currentTrainId = trainId;
            let trainData = this.trains.get(trainId)

            trainData.type = this.formatTrainType(trainData.level)
            trainData.terminal = this.formatTrainTerminal(trainData).name;
            let terminalInfo = this.getTrainDataOfStation("-1", trainId)
            trainData.terminalTime = myTime.formatTime(terminalInfo.arrivalTime)

            let nextInfo = this.getNextStationInfo(trainId)
            console.log('下一站信息')
            console.log(nextInfo)
            trainData.nextStop = this.stations.get(nextInfo.stationId.toString()).name;
            trainData.arriveNextTime = nextInfo.arrivalTime;

            if (typeof (trainData.isShowDetail) == "undefined" || !trainData.isShowDetail) {
                trainData.isShowDetail = true;
                this.$forceUpdate()
            }
        },

        //第一次加载
        async load(line) {
            this.line = line;
            this.reset()
            this.currentStationId = "-1"
            this.trainSchedules = undefined
            this.stations = new Map()

            const url = this.assertsPath + 'lineInfo/' + line + '.json'
            await axios.get(url).then(res => {
                let names = res.data.stations
                let stationIds = res.data.stationIds
                this.firstId = stationIds[0]
                this.lastId = stationIds.slice(-1)[0]
                this.color = res.data.color;

                if (typeof (res.data.trainType) != "undefined") {
                    this.trainType = res.data.trainType
                    console.log(this.trainType)
                }
                this.direction = false;
                for (let i = 0; i < names.length; i++) {
                    this.stations.set(
                        stationIds[i] + "",
                        {
                            "stationId": stationIds[i],
                            "name": names[i],
                            "radius": 5,
                            "color": "#FFFFFF",
                            "strokeWidth": 0,
                            "trains": [],
                            "position": i,
                            "transferLines": res.data.transferInfo[stationIds[i] + ""]
                        }
                    )
                }
                console.log(url + ' loaded')
            }, () => {
                console.log('Load ' + url + ' Error!')
            })
        },


        async loadTrainSchedules(line) {
            console.log('loading timetable:' + line)
            let url = this.assertsPath + 'timetable/' + line + '/'
            if (this.isWorkDay()) {
                url += line + '-workday' + '-train-schedule.json'
            } else {
                url += line + '-restday' + '-train-schedule.json'
            }
            await axios.get(url).then(res => {
                this.trainSchedules = res.data;
            })
        },

        addTrainPosition(position, trainId) {
            position = position.toString()
            if (!this.trainPosition.has(position)) {
                this.trainPosition.set(position, [])
            }
            this.trainPosition.get(position).push(trainId)
        },

        getNowTime() {
            // return '14:18:23'
            return new Date().format('HH:mm:ss')
        },

        loadTrains() {
            console.log('Loading trains...')
            //1.判断是否已加载所有列车的时刻表
            if (typeof (this.trainSchedules) === "undefined" || this.trainSchedules.size === 0) {
                console.log("列车时刻表未加载")
                return
            }
            if (typeof this.stations === "undefined" || this.stations.size === 0) {
                return
            }

            const scheduleArray = Object.values(this.trainSchedules)

            let now = this.getNowTime()
            //当前在线运营的列车：符合 "始发站到达时间 <= 当前时间 <= 终点站离开时间" 条件的列车
            let onServiceTrains = scheduleArray
                .filter(element => this.selectDirection(element.direction))
                .filter(element => this.selectTime(element.schedule[element.schedule.length - 1].departTime, true))
                .filter(element => this.selectTime(element.schedule[0].arrivalTime, false))
            console.log('当前在线列车:')
            onServiceTrains.forEach(e => console.log(e.trainId))
            console.log(onServiceTrains)

            //记录在线运营列车的车次，用于删除this.trains中过时的列车
            let onServiceTrainNumbers = new Map()
            //更新this.trainPosition
            this.trainPosition.clear()
            //计算每列车的当前位置
            onServiceTrains.forEach(train => {
                onServiceTrainNumbers.set(train.trainId, '')
                train.position = this.calcTrainPosition(train)

                train.positionInView = this.calcTrainPositionInView(train.position)
                this.addTrainPosition(train.position, train.trainId)
                //把在运营的列车放入this.trains
                this.trains.set(train.trainId, train)
            })
            console.log('当前列车位置')
            console.log(this.trainPosition)
            //删除this.trains中在onServiceTrainNumbers没有的车次
            for (const trainId of this.trains.keys()) {
                if (!onServiceTrainNumbers.has(trainId)) {
                    console.log('trainId' + '退出运营')
                    this.trains.delete(trainId)
                }
            }

            //修改Map类型对象需要强制更新视图
            this.$forceUpdate()
            console.log('trains loaded.')
        },

        switchLine(line, loadStationId) {
            this.line = line;
            this.load(line).then(() => {
                // 加载列车车次
                this.loadTrainSchedules(line).then(() => {
                    this.loadTrains()
                })

                if (typeof loadStationId == "undefined") {
                    this.initFavouredStation()
                    return
                }

                this.scrollToStation(loadStationId)
            })
        },

        switchLineSelf(line, loadStationId) {
            window.parent.switchLineSelf(line, loadStationId)
        },

        initFavouredStation() {
            let station = cookie.getCookie(this.line)
            if (station === "") {
                this.favouredStation = "-1";
                return;
            }
            this.favouredStation = station;
            this.scrollToStation(this.favouredStation.toString())
        },

        scrollToStation(stationId) {
            if (typeof stationId === "undefined" || stationId === "-1") {
                return
            }
            stationId = stationId.toString()
            let position = this.getStationPosition(stationId)
            this.showStationInfo(stationId)
            this.$nextTick(() => {
                let scrollY = position * this.perSegment;
                window.scrollTo(0, scrollY)
            })
        },

        favourStation(stationId) {
            if (this.favouredStation === stationId) {
                this.favouredStation = "-1"
                cookie.setCookie(this.line, "", 90)
                return
            }
            this.favouredStation = stationId
            cookie.setCookie(this.line, stationId, 90)
        },

        resetStation() {
            this.lastStationId = "-1"
            this.stations.forEach((station) => {
                station.trains = [];
            })
        },

        reset() {
            this.resetStation()
            this.resetTrains()
            this.resetStationStyle()
        },

        resetTrains() {
            this.trains = new Map()
            this.currentTrain = "-1";
            this.trainPosition = new Map()
        },

        resetStationStyle() {
            if (this.lastStationId === "-1") {
                return;
            }
            this.stations.get(this.lastStationId).strokeWidth = 0;
            this.stations.get(this.lastStationId).radius = this.normalRadius;
        },

        //由父页面换向时调用, 实现本页面的切换上下行
        reverseDirection() {
            this.reset()

            this.direction = !this.direction
            this.reverseStations()

            this.loadTrains()
            if (this.currentStationId !== "-1") {
                this.scrollToStation(this.currentStationId)
            } else {
                this.initFavouredStation()
            }
        },

        reverseStations() {
            this.stations = new Map(Array.from(this.stations).reverse())
            this.$forceUpdate()
        },

        setStationStyle(stationId) {
            if (stationId.toString() === "-1") {
                return
            }
            this.resetStationStyle()
            stationId = stationId.toString()
            this.stations.get(stationId).radius = this.selectedRadius;
            this.stations.get(stationId).strokeWidth = 3;
        },

        showStationInfo(stationId) {
            this.lastStationId = this.currentStationId
            this.setStationStyle(stationId)
            this.currentStationId = stationId
            this.updateStationSchedule(stationId)
        },

        updateStationSchedule(stationId) {
            if (typeof stationId == "undefined" || stationId === "-1") {
                return
            }
            if (typeof this.trainSchedules === "undefined") {
                this.stations.get(stationId.toString()).trains = [
                    {
                        "status": "加载中...",
                        "eta": "Loading...",
                        "terminal": "",
                        "description": ""
                    }
                ]
                return
            }

            const TOTAL_DISPLAY_TRAIN_NUMBER = 3
            stationId = stationId.toString()
            if (stationId === "-1") {
                return;
            }
            let trainList = this.getLatestTrains(stationId, TOTAL_DISPLAY_TRAIN_NUMBER)
            //暂无列车
            if (trainList.length < TOTAL_DISPLAY_TRAIN_NUMBER) {
                const futureTrains = this.getScheduleTrains(stationId).slice(0, TOTAL_DISPLAY_TRAIN_NUMBER - trainList.length)
                console.log('未来列车')
                console.log(futureTrains)
                let trainMap = new Map(trainList.map(e => {
                    return [e.trainId, e]
                }))
                futureTrains.forEach(e => {
                    if (!trainMap.has(e.trainId)) {
                        trainMap.set(e.trainId, e)
                    }
                })

                trainList = Array.from(trainMap.values())
                let t = {
                    "status": "停止服务",
                    "eta": "Out of service",
                    "terminal": "",
                    "description": ""
                }
                if (trainList.length < 1) {
                    trainList.push(t)
                }
            }
            //格式化数据
            trainList.forEach(trainData => {
                this.formatTrainData(trainData, stationId)
            })

            this.stations.get(stationId.toString()).trains = trainList;
        },

        formatTrainData(trainData, stationId) {
            if (typeof (trainData.schedule) == "undefined") {
                return;
            }
            trainData.status = this.formatTrainStatus(trainData)

            //判断是否为始发站
            const judgeFirstStop = (sid, tData) => {
                return Number(sid) === tData.schedule[0].stationId;
            }
            const isFirstStop = judgeFirstStop(stationId, trainData)
            trainData.eta = this.formatETA(trainData, isFirstStop)

            trainData.terminal = this.formatTrainTerminal(trainData).name;

            trainData.description = this.formatTrainDescription(trainData, isFirstStop)
        },
        formatTrainTerminal(trainData) {
            let terminalId = trainData.schedule.slice(-1)[0].stationId;
            return this.stations.get(terminalId.toString())
        },
        formatTrainStatus(trainData) {
            if (trainData.arrivalTime === '......') {
                return '不停站通过'
            }

            let now = this.getNowTime()
            if (now < trainData.arrivalTime) {
                let d1 = new Date('2023/01/01 ' + now)
                let d2;
                //凌晨0点到2点算为第2天
                if (trainData.arrivalTime <= '02:00:00') {
                    d2 = new Date('2023/01/02 ' + trainData.arrivalTime)
                } else {
                    d2 = new Date('2023/01/01 ' + trainData.arrivalTime)
                }
                //当前时间和到达时间相差的秒数
                let difference = Math.ceil((d2 - d1) / 1000)
                if (difference <= 15) {
                    return '即将到站'
                } else {
                    let min = Math.ceil(difference / 60)
                    // if (min === 0) {
                    //     min = 1;
                    // }
                    return min + '分钟';
                }
            } else if (now >= trainData.arrivalTime && now <= trainData.departTime) {
                return '车已到站'
            } else if (now > trainData.departTime) {
                return '车已过站'
            }
        },
        formatETA(trainData, isFirstStop) {
            if (trainData.arrivalTime === '......') {
                return 'No stop'
            }
            if (isFirstStop) {
                return myTime.formatTime(trainData.departTime)
            }

            return myTime.formatTime(trainData.arrivalTime)
        },

        formatTrainDescription(trainData, isFirstStop) {
            const trainType = this.trainType[trainData.level.toString()]
            trainData.description = ""
            if (isFirstStop) {
                trainData.description = "始发"
            }
            if (trainType.includes('快')) {
                return trainType
            }
            return trainData.description
        },

        formatTrainType(trainLevel) {
            return this.trainType[trainLevel.toString()]
        },


        //获取id为stationId车站最近number次列车
        getLatestTrains(stationId, number) {
            let trainList = [];
            const rawStationId = stationId;
            let stationPosition = this.getStationPosition(stationId)
            while (trainList.length < number) {
                if (this.trainPosition.has(stationPosition.toString())) {
                    const trains = this.trainPosition.get(stationPosition.toString())
                    trains.forEach(element => {
                        //element: trainId
                        const trainDataOfStation = this.getTrainDataOfStation(rawStationId, element)
                        if (trainDataOfStation !== undefined && trainDataOfStation.arrivalTime !== '......') {
                            trainList.push(trainDataOfStation)
                        }
                    })
                }
                stationPosition -= 0.5
                if (stationPosition < 0) {
                    //搜索完该站之前的列车即返回
                    break;
                }
            }
            trainList.sort((obj1, obj2) => {
                return obj1.arrivalTime.localeCompare(obj2.arrivalTime)
            })

            //切片，trainList长度小于等于number
            return trainList.slice(0, number)
        },

        //获取trainId次列车stationId站的时刻
        getTrainDataOfStation(stationId, trainId) {
            if (typeof (this.trainSchedules[trainId]) == "undefined") {
                console.log('没有' + trainId + '次列车的数据')
                return undefined
            }
            if (stationId === "-1") {
                //查询终点站
                return this.trainSchedules[trainId].schedule.slice(-1)[0];
            }

            //对象使用 = 赋值 修改引用会改变原对象
            let trainData = Object.assign({}, this.trainSchedules[trainId])
            return this.toTrainDataOfStation(stationId, trainData)
        },

        toTrainDataOfStation(stationId, rawTrainData) {
            const schedule = rawTrainData.schedule.find(element => element.stationId === Number(stationId))
            if (schedule === undefined) {
                return
            }
            rawTrainData.departTime = schedule.departTime;
            rawTrainData.arrivalTime = schedule.arrivalTime;
            return rawTrainData
        },

        isWorkDay() {
            let now = new Date()
            return !(now.getDay() === 0 || now.getDay() === 6)
        },

        calcTrainPosition(train) {
            let now = this.getNowTime()
            for (let i = 0; i < train.schedule.length - 1; i++) {
                const departTime = train.schedule[i].departTime
                const arrivalTime = train.schedule[i].arrivalTime
                if (now >= arrivalTime && now <= departTime) {
                    //在当前站点
                    return this.getStationPosition(train.schedule[i].stationId)
                } else if (now > departTime && now < train.schedule[i + 1].arrivalTime) {
                    //在当前站点与下一站之间
                    return this.getStationPosition(train.schedule[i].stationId) + 0.5
                }
            }
            //在终点站
            const terminalArrivalTime = train.schedule[train.schedule.length - 1].arrivalTime
            const terminalDepartTime = train.schedule[train.schedule.length - 1].departTime
            if (now >= terminalArrivalTime && now <= terminalDepartTime) {
                let id = train.schedule[train.schedule.length - 1].stationId
                return this.getStationPosition(id)
            }
            return -1
        },

        //计算列车在页面中的位置
        calcTrainPositionInView(position) {
            // 上一站id(不一定是停车站,只是当前位置的上一站)
            return this.firstPos + this.perSegment * position
        },

        //查询列车下一站信息
        getNextStationInfo(trainId) {
            if (!this.trains.get(trainId)) {
                console.log(trainId + '不在运营时间内')
            }
            let trainData = this.trains.get(trainId)

            let position = Number(trainData.position)

            let nextPosition
            if (position > parseInt(position)) {
                nextPosition = this.direction ? Math.floor(position + 1) : Math.ceil(position)
            } else {
                nextPosition = position + 1
            }
            //查询根据当前位置下一站id
            const nextId = this.getStationIdByPosition(nextPosition)

            let index = trainData.schedule.findIndex(element => element.stationId === Number(nextId))
            while (true) {
                const scheduleItem = trainData.schedule[index]
                if (typeof scheduleItem == "undefined") {
                    console.log('获取下一站失败')
                    return undefined
                }
                //如果不停靠该站点，则顺序查找下一站
                if (scheduleItem.arrivalTime === '......') {
                    index += 1
                    continue
                }
                return scheduleItem
            }
        },

        getStationIdByPosition(position) {
            position = this.direction ? this.stations.size - 1 - position : position
            return Array.from(this.stations.values()).find(e => e.position === position).stationId
        },

        /**
         * 获取车站在页面的位置(上下行位置不同)
         *  @param stationId: 车站真实id Number|String
         *  @return number
         **/
        getStationPosition(stationId) {
            stationId = stationId + ""
            if (!this.stations.has(stationId)) {
                console.log('获取stationId:' + stationId + '在页面中的位置失败, stations中没有该id')
                return undefined
            }
            const position = Number(this.stations.get(stationId).position)
            return this.direction ? this.stations.size - position - 1 : position
        },

        /**
         * 获取某站未来的列车
         * @param stationId
         */
        getScheduleTrains(stationId) {
            let trains = Array.from(this.preLoadTrains(stationId))
                .sort((obj1, obj2) => {
                    return obj1.schedule[0].departTime.localeCompare(obj2.schedule[0].departTime)
                })
            console.log(trains)
            trains.forEach(e => this.toTrainDataOfStation(stationId, e))
            trains = trains.filter(e => e !== undefined)
            return Array.from(trains)
        },

        preLoadTrains() {
            if (this.trainSchedules === undefined) {
                console.log('预加载列车失败，时刻表未加载')
                return
            }
            const scheduleArray = Object.values(this.trainSchedules)
            let x = scheduleArray
                .filter(element => this.selectDirection(element.direction))
                .filter(element => this.selectTime(element.schedule[0].departTime, true))
            console.log(x)
            return x
        },

        //筛选出上/下行方向的列车
        selectDirection(num) {
            if (this.direction) {
                return num % 2 === 1
            } else {
                return num % 2 === 0
            }
        },

        //判断time是否在当前之间之前或之后, 并规定凌晨0-2点为较后的时间(00:05:23>23:58:01)
        selectTime(time, isLatter) {
            let now = this.getNowTime()
            const t = '02:00:00'
            if (time >= t || (time <= t && now <= t)) {
                //time不在0-2点或now和time都在0-2点, 则直接比较
                return isLatter ? time >= now : time < now
            } else {
                //time在0-2点 或 now在time不在
                return isLatter
            }
        }
    }
})