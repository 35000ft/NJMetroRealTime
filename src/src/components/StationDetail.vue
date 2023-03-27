<template>
    <div class="main">
        <v-touch @swipedown="$emit('closeStationDetail')">
            <div class="control-wrapper">
                <span>
                    <img :src="`${publicPath}icon/refresh.png`" :class="{ 'refresh': isRefreshing }" @click="handleRefresh"
                        @animationend="resetRefresh" alt="刷新">
                    <img :src="`${publicPath}icon/close.png`" @click="$emit('closeStationDetail')" alt="关闭">
                </span>
            </div>
            <v-touch @swipeleft="changeToNextStation" @swiperight="changeToLastStation">
                <div class="station-name-warpper">
                    <span class="last-station-name">{{ lastStation }}</span>
                    <h1>{{ stationName }}</h1>
                    <span class="next-station-name">{{ nextStation }}</span>
                </div>
            </v-touch>
            <div class="line-title-wrapper">
                <span v-for="(item, index) in lines" :key="index" :style="{
                    backgroundColor: item.code === selectedLine ? item.color : '#efefef',
                    color: item.code === selectedLine ? '#ffffff' : '#858585'
                }" @click="handleChangeLine(item.code)">
                    {{ item.name }}
                </span>
            </div>
        </v-touch>

        <v-touch @swipeleft="changeToNextLine" @swiperight="changeToLastLine">
            <div class="schedule-wrapper">
                <table>
                    <tr>
                        <th class="direction">方向</th>
                        <th class="status">状态</th>
                        <th class="etd">发车时间</th>
                        <th class="train-type">车种</th>
                    </tr>
                    <tr class="train-info" v-if="latestTrains.length === 0">
                        <td class="direction">暂无列车</td>
                        <td class="status">No Train</td>
                        <td class="etd">/</td>
                        <td class="train-type">/</td>
                    </tr>
                    <tr class="train-info" v-for="(train, index) in latestTrains" :key="index">
                        <td class="direction">{{ train.terminal }}</td>
                        <td class="status">{{ train.status }}</td>
                        <td class="etd">{{ train.etd }}</td>
                        <td class="train-type">{{ train.type }}</td>
                    </tr>
                </table>
            </div>
        </v-touch>
    </div>
</template>
<script>
import moment from 'moment'

export default {
    name: 'StationDetail',
    components: {

    },
    mixins: [],
    props: {
        stationNameProp: String,
        rawSelectedLine: String
    },
    data() {
        return {
            stationName: '',
            stationId: -1,
            // 包含的线路
            lines: [],
            // 最近列车
            latestTrains: [],
            // 车站时刻表
            schedules: new Map,
            // 换乘信息
            transferInfo: {
            },
            selectedLine: '',
            stationNames: [],
            nextStation: '',
            lastStation: '',
            currentStationIndex: -1,
            isRefreshing: false,
            publicPath: process.env.BASE_URL
        }
    },
    computed: {

    },
    watch: {
        stationNameProp: {
            handler() {
                this.stationName = this.stationNameProp
            }
        },
        stationName: {
            handler() {
                this.loadStationInfo()
            }
        },
        selectedLine: {
            handler() {
                this.updateStationNames()
                this.getLatestTrains(this.selectedLine)
            }
        }
    },
    mounted() {
        this.stationName = this.stationNameProp
        this.loadStationInfo()
        setInterval(() => {
            this.getLatestTrains(this.selectedLine)
        }, this.$constant.Business.UPDATE_STATION_FREQUENCY)
    },
    methods: {
        loadStationInfo() {
            this.$axios.get('./data/stations/' + this.stationName + '.json').then(
                response => {
                    const data = response.data

                    this.stationId = data.id
                    this.lines = data.lines
                    this.transferInfo = data.transferInfo

                    if (this.rawSelectedLine != undefined
                        && this.lines.findIndex(item => item.code === this.rawSelectedLine) != -1) {
                        this.selectedLine = this.rawSelectedLine
                    } else {
                        this.selectedLine = this.lines[0].code
                    }
                    this.updateStationNames()
                    this.getLatestTrains(this.selectedLine)
                }
            )
        },

        async updateStationNames() {
            this.$store.dispatch('getLineStationNames', this.selectedLine).then(names => {
                this.stationNames = names
                this.currentStationIndex = this.stationNames.findIndex(element => element === this.stationName)
                const length = this.stationNames.length
                if (this.currentStationIndex >= length - 1) {
                    this.nextStation = "终点站"
                    this.lastStation = this.stationNames[this.currentStationIndex - 1]
                } else if (this.currentStationIndex <= 0) {
                    this.lastStation = "终点站"
                    this.nextStation = this.stationNames[this.currentStationIndex + 1]
                } else {
                    this.nextStation = this.stationNames[this.currentStationIndex + 1]
                    this.lastStation = this.stationNames[this.currentStationIndex - 1]
                }
            })
        },

        handleChangeLine(line) {
            this.selectedLine = line
            this.getLatestTrains(line)
        },

        changeToNextLine() {
            const totalLength = this.lines.length
            if (totalLength < 2) return
            const currentIndex = this.lines.findIndex(item => item.code === this.selectedLine)
            if (currentIndex >= totalLength - 1) {
                this.selectedLine = this.lines[0].code
            } else {
                this.selectedLine = this.lines[currentIndex + 1].code
            }
        },

        changeToLastLine() {
            const totalLength = this.lines.length
            if (totalLength < 2) return
            const currentIndex = this.lines.findIndex(item => item.code === this.selectedLine)
            if (currentIndex <= 0) {
                this.selectedLine = this.lines.slice(-1)[0].code
            } else {
                this.selectedLine = this.lines[currentIndex - 1].code
            }
        },

        changeToNextStation() {
            //如果查看的线路不是当前线路，则不允许切换车站
            if (this.selectedLine !== this.rawSelectedLine) return
            const totalLength = this.stationNames.length
            if (totalLength < 2) return
            const currentIndex = this.stationNames.findIndex(item => item === this.stationName)
            if (currentIndex >= totalLength - 1) {
                this.stationName = this.stationNames[0]
            } else {
                this.stationName = this.stationNames[currentIndex + 1]
            }
        },

        changeToLastStation() {
            if (this.selectedLine !== this.rawSelectedLine) return
            const totalLength = this.stationNames.length
            if (totalLength < 2) return
            const currentIndex = this.stationNames.findIndex(item => item === this.stationName)
            if (currentIndex <= 0) {
                this.stationName = this.stationNames.slice(-1)[0]
            } else {
                this.stationName = this.stationNames[currentIndex - 1]
            }
        },

        handleRefresh() {
            this.isRefreshing = true
            this.getLatestTrains(this.selectedLine)
        },

        async loadLineSchedule(line) {
            if (line == undefined || line === '') return

            return await this.$store.dispatch("getStationSchedule", [this.stationId, line]).then(schedule => {
                if (schedule == null) return false
                this.schedules.set(line, schedule)
                return true
            })
        },

        async getLatestTrains(line) {
            if (line == undefined || line === '') return

            this.latestTrains = []
            this.latestTrains.push(this.$constant.Business.LOADING_TRAIN)

            //等待加载时刻表
            const isLoaded = await this.loadLineSchedule(line)
            if (!isLoaded) {
                this.latestTrains.splice(0, 1, this.$constant.Business.ERROR_TRAIN)
                return
            }

            const isAfter = this.$constant.Business.isAfter
            const t0 = this.$constant.Business.t0
            let futureTrains = this.schedules
                .get(line)
                .filter(train => {
                    return isAfter(train.departTime)
                })
                .sort((obj1, obj2) => {
                    const t1 = obj1.departTime, t2 = obj2.departTime
                    if ((t1 >= t0 && t2 >= t0) || (t1 < t0 && t2 < t0)) {
                        return t1.localeCompare(t2)
                    } else if (t1 < t0 && t2 > t0) {
                        return 1
                    } else if (t2 < t0 && t1 > t0) {
                        return -1
                    }
                })

            this.latestTrains = []
            //添加不同方向的列车到最近列车 
            const addLatestTrains = (direction, number) => {
                futureTrains
                    .filter(element => element.direction === direction)
                    .slice(0, number)
                    .forEach(train => {
                        this.latestTrains.push(this.formatTrain(train))
                    })
            }
            addLatestTrains(0, 2)
            addLatestTrains(1, 2)
        },

        formatTrain(train) {
            let t = {}
            t.etd = this.formatTrainETD(train)
            t.status = this.formatTrainStatus(train)
            t.type = this.formatTrainType(train)
            t.terminal = this.$constant.Static.STATIONS[train.terminal]
            console.log(t)
            return t
        },

        formatTrainETD(train) {
            if (train.isTerminal) return '/'
            else if (train.arrivalTime === "......") return "不停车通过"

            const time = train.departTime

            let etd = moment(time, "HH:mm:ss")
            const seconds = etd.second()
            if (seconds >= 30) {
                etd.add(1, 'minute')
            }
            return etd.format('HH:mm')
        },

        formatTrainStatus(train) {
            if (train.arrivalTime === "......") return "请勿上车"

            let now = this.$constant.Business.getNowTime()
            let departTime, arrivalTime
            const t0 = this.$constant.Business.t0

            if (train.departTime < t0 && now > t0) {
                departTime = '2023-01-02 ' + train.departTime
            } else {
                departTime = '2023-01-01 ' + train.departTime
            }
            if (train.arrivalTime < t0 && now > t0) {
                arrivalTime = '2023-01-02 ' + train.arrivalTime
            } else {
                arrivalTime = '2023-01-01 ' + train.arrivalTime
            }

            now = "2023-01-01 " + now

            if (moment(arrivalTime).isAfter(now)) {
                let diffSeconds = -1
                diffSeconds = moment(new Date(arrivalTime)).diff(now, 'seconds')
                if (diffSeconds <= 15) {
                    return "即将到达"
                }
                return Math.ceil(diffSeconds / 60) + '分钟'
            } else if (moment(departTime).isAfter(now)) {
                return "车已到站"
            } else {
                return "车已过站"
            }

        },

        formatTrainType(train) {
            if (train.isTerminal) {
                return "终到"
            }

            let type = ''
            const table = this.$constant.Business.TRAIN_LEVEL_TABLE
            type = table[train.level.toString()]

            //不是普通车且不是终到车
            if (!type.includes("普通")) {
                return type
            }

            //是普通车且是始发车
            if (train.isOriginating) {
                type = "始发"
            }
            return type
        },

        resetRefresh() {
            this.isRefreshing = false
        },
    }
}
</script>
<style scoped>
.main {
    width: 90%;
    top: calc(65vh);
    height: calc(35vh);
    position: relative;
    z-index: 5;
    background-color: #ebe5e5;
    border-top-right-radius: 15px;
    border-top-left-radius: 15px;
    border: 2px solid #b8b8b8;
    margin: 0 auto;
}

.station-name-warpper {
    height: 30px;
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
    margin-bottom: 5px;
    padding-left: 2.5px;
    padding-right: 2.5px;
    display: flex;
    justify-content: space-around;
}

.station-name-warpper h1 {
    display: flex;
    font-weight: bold;
    font-size: 20px;
    text-align: center;
    position: absolute;
}


.last-station-name {
    height: 30px;
    color: #a5a5a5;
    width: 100px;
    margin-right: auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.next-station-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 30px;
    width: 100px;
    color: #a5a5a5;
    margin-left: auto;
}


.control-wrapper {
    height: 25px;
    padding: 1%;
}

.control-wrapper span {
    display: flex;
    float: right;
}

.control-wrapper img {
    height: 25px;
}

.line-title-wrapper {
    width: 100%;
    height: 35px;
    font-size: 15px;
    display: flex;
    float: left;
    padding-bottom: 10px;
    border-bottom: 1px solid #858585;
}

.line-title-wrapper span {
    display: inline-block;
    margin: auto 5px;
    padding: 2px 6px;
    color: #858585;
    background-color: #efefef;
    text-align: center;
    border-radius: 5px;
}

.schedule-wrapper {
    width: 100%;
    height: calc(100%-70px);
    display: flex;
    justify-content: center;
}

.schedule-wrapper table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
}

.schedule-wrapper table .direction {
    width: 35%;
}

.schedule-wrapper table .status {
    width: 25%;
}

.schedule-wrapper table .etd {
    width: 20%;
}

.schedule-wrapper table .train-type {
    width: 25%;
}

.schedule-wrapper table td {
    padding-right: 5px;
    padding-left: 5px;
}

@keyframes rotate {
    0% {
        -webkit-transform: rotate(0deg);
    }

    25% {
        -webkit-transform: rotate(90deg);
    }

    50% {
        -webkit-transform: rotate(180deg);
    }

    75% {
        -webkit-transform: rotate(270deg);
    }

    100% {
        -webkit-transform: rotate(360deg);
    }
}

.refresh {
    animation: rotate 0.5s linear 0s;
}

.train-info {
    height: 20px;
    background-color: #ffffff;
}
</style>