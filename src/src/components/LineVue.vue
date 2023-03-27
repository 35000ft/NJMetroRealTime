<template>
    <div class="main">
        <v-touch @swiperight="$emit('switchToLastLine')" @swipeleft="$emit('switchToNextLine')">

            <div class="header">
                <div class="line-info">
                    <table>
                        <tr style="height: 66.7%;">
                            <td rowspan="2">
                                <img :src="'./icon/' + lineCode + '.svg'" v-if="lineCode !== undefined">
                            </td>
                            <td>
                                <h1>{{ lineName }}</h1>
                            </td>
                        </tr>
                        <tr style="height: 33.3%;">
                            <td>{{ lineHint }}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="direction-hint">
                <img :src="`${publicPath}icon/arrow-up-bold.svg`">
                {{ upHint }}
            </div>
        </v-touch>

        <div class="content">

            <span class="station-wrapper">
                <v-touch @swiperight="$emit('switchToLastLine')" @swipeleft="$emit('switchToNextLine')">
                    <span class="station-name-wrapper" v-for="(item, index) in stations" :key="index"
                        @click="showStationDetail(item.name)">
                        <span class="station-name">
                            {{ item.name }}
                        </span>
                        <span class="transfer-info">
                            <img v-for="(lineCode, index) in item.transferInfo" :key="index"
                                :src="'./icon/' + lineCode + '.svg'" @click="$emit('switchToLine', lineCode)">
                        </span>
                    </span>
                </v-touch>
            </span>

            <!-- 下行车 -->
            <span class="down-train-wrapper">
                <span class="train-img-wrapper" v-for="(train, index) in downTrains" :key="'down-train-' + index"
                    :style="{ top: (0 + train.position) + 'px' }" @click="showTrainDetail(train)">
                    <img :src="'./icon/train/' + train.trainId.match(/(\S*)(?=-)/)[1] + '.svg'" alt="">
                    <span class="direction-icon"
                        :class="{ 'lightening': isDirectionLightening, 'normal': !isDirectionLightening }">
                        <svg width="15px" height="8px">
                            <polygon points="0,0 7.5,7 15,0" />
                        </svg>
                    </span>
                </span>
                <span class="train-terminal" v-for="(train, index) in downTrains" :key="'down-train-terminal' + index"
                    :style="{ top: (0 + train.position) + 'px' }">
                    {{ train.terminal }}
                </span>
            </span>

            <span class="line-wrapper">
                <span class="line-graphic">
                    <svg width="20px" :height="line.length" v-for="(line, index) in lineGraphic" :key="index"
                        xmlns="http://www.w3.org/2000/svg">
                        <line :stroke="line.color" stroke-width="10" x1="10" x2="10" :y2="line.length" y1="0" />
                    </svg>
                </span>
                <span class="station-circle" v-for="(item, index) in stations" :key="index"
                    @click="showStationDetail(item.name)">
                    <svg class="normal" height="20px" width="20px" xmlns="http://www.w3.org/2000/svg">
                        <circle :r="5" stroke="#ffffff" fill="#ffffff" cx="10" cy="10" />
                    </svg>
                </span>
            </span>

            <!-- 上行车 -->
            <span class="up-train-wrapper">
                <span class="train-img-wrapper" v-for="(train, index) in upTrains" :key="'up-train-' + index"
                    :style="{ top: (-18 + train.position) + 'px' }" @click="showTrainDetail(train)">
                    <span class="direction-icon"
                        :class="{ 'lightening': isDirectionLightening, 'normal': !isDirectionLightening }">
                        <svg width="15px" height="8px">
                            <polygon points="0,7 7.5,0 15,7" />
                        </svg>
                    </span>
                    <img :src="'./icon/train/' + train.trainId.match(/(\S*)(?=-)/)[1] + '.svg'" alt="">
                </span>
                <span class="train-terminal" v-for="(train, index) in upTrains" :key="'up-train-terminal' + index"
                    :style="{ top: (0 + train.position) + 'px' }">
                    {{ train.terminal }}
                </span>
            </span>
        </div>

        <div class="direction-hint">
            <img :src="`${publicPath}icon/arrow-down-bold.svg`">
            {{ downHint }}
        </div>

    </div>
</template>
<script>

export default {
    name: 'LineVue',
    components: {
    },
    mixins: [],
    props: {
        lineCodeProp() { }
    },
    data() {
        return {
            duration: 0,
            isDirectionLightening: false,
            lineColor: '',
            lineName: '',
            downHint: '',
            upHint: '',
            lineHint: '',
            downTrains: [],
            upTrains: [],
            lineGraphic: [],
            stations: [],
            stationMap: new Map,
            publicPath: process.env.BASE_URL
        }
    },
    computed: {
        totalHeight() {
            return this.lineGraphic.reduce((total, x) => { return total + x.length }, 0)
        },
        lineCode() {
            return this.lineCodeProp
        }
    },
    watch: {
        lineCodeProp: {
            handler() {
                this.lineGraphic.splice(0)
                this.downTrains.splice(0)
                this.upTrains.splice(0)
                this.stations.splice(0)
                this.stationMap.clear()
                this.loadLineInfo()
            }
        }
    },
    mounted() {
        setInterval(() => {
            this.duration += 1
            this.isDirectionLightening = this.duration % 3 === 0
        }, 1000)

        setInterval(() => {
            this.loadOnServiceTrains()
        }, 5000);

        this.loadLineInfo().then(() => {
            this.loadOnServiceTrains()
        })

    },
    methods: {
        async loadLineInfo() {
            console.log('加载', this.lineCode, '线路信息');
            this.$store.dispatch('loadLineInfo', this.lineCode).then(
                response => {
                    const data = response
                    this.lineGraphic = data.lineGraphic.slice()
                    this.lineName = data.lineName
                    this.lineColor = data.lineColor
                    this.upHint = data.upHint
                    this.downHint = data.downHint
                    this.lineHint = data.stationNames[0] + '~' + data.stationNames.slice(-1)[0]

                    data.stationNames.forEach((element, index) => {
                        let station = {
                            name: element,
                            id: data.stationIds[index],
                            transferInfo: [],
                            position: index * 100
                        }
                        this.stationMap.set(station.id.toString(), index)

                        const transferInfo = data.transferInfo[station.id.toString()]
                        if (transferInfo != undefined) {
                            station.transferInfo = transferInfo
                        }

                        this.stations.push(station)
                    })
                },
                error => { console.log(error) }
            )
        },

        async loadOnServiceTrains() {
            if (typeof this.lineCode == "undefined" || this.lineCode === '') return
            this.$store.dispatch("getOnServiceTrains", this.lineCode).then((onServiceTrains) => {
                onServiceTrains.forEach(train => {
                    const result = this.calcTrainPosition(train)
                    //在页面的位置：3200(px)
                    train.position = result[0]
                    //文字描述：新街口~张府园 
                    train.location = result[1]
                    train.terminal = this.$constant.Static.STATIONS[train.route.split('-').slice(-1)[0]]
                })

                console.log(onServiceTrains)
                this.downTrains = onServiceTrains.filter(train => { return train.direction === 0 })
                this.upTrains = onServiceTrains.filter(train => { return train.direction === 1 })
            })
        },

        calcTrainPosition(train) {
            const isAfter = this.$constant.Business.isAfter
            let nextStationIndex = train.schedule.findIndex(item => {
                if (item.arrivalTime === "......") return isAfter(item.departTime)
                else return isAfter(item.arrivalTime)
            })

            let nextStation
            //nextStationIndex=-1: 终点站
            if (nextStationIndex === -1) {
                nextStation = this.getStation(train.schedule.slice(-1)[0].stationId)
                return [nextStation.position, nextStation.name]
            }

            let currentStationScheduleItem = train.schedule[nextStationIndex - 1]
            const currentStation = this.getStation(currentStationScheduleItem.stationId)

            if (isAfter(currentStationScheduleItem.departTime)) {
                //位于当前站
                return [currentStation.position, currentStation.name]
            } else {
                //位于当前站与下一站的区间
                nextStation = this.getStation(train.schedule[nextStationIndex].stationId)
                return [(nextStation.position + currentStation.position) / 2, currentStation.name + '~' + nextStation.name]
            }
        },

        getStation(stationId) {
            const index = this.stationMap.get(stationId.toString())
            return this.stations[index]
        },

        getStationPosition(stationId) {
            const index = this.stationMap.get(stationId.toString())
            return this.stations[index].position
        },

        showStationDetail(stationName) {
            this.$emit('changeSelectedStation', stationName)
        },

        showTrainDetail(train) {
            this.$emit('changeSelectedTrain', train)
        }

    }
};
</script>
<style scoped>
.main {
    height: calc(90vh);
    width: 100%;
    top: calc(3vh);
    bottom: 40px;
    position: absolute;
    z-index: 0;
    overflow-x: hidden;
}

.header {
    height: 60px;
    margin-bottom: 10px;
}

.content {
    height: calc(70vh);
    display: flex;
    justify-content: space-around;
    overflow-x: hidden;
    overflow-y: scroll;
    margin-left: 20px;
    margin-right: 18px;
}


.direction-hint {
    margin: 0 auto;
    width: 90%;
    height: 25px;
    background-color: #dcdcdc;
    display: flex;
    font-weight: bold;
}

.direction-hint img {
    height: 25px;
    margin-left: 10px;
    margin-right: 10px;
}

.line-wrapper {
    display: inline-block;
    height: 600px;
    width: 40px;
    position: relative;
    z-index: 1;
}


.station-wrapper {
    display: inline-block;
    height: 600px;
    width: 40%;
}

.line-info {
    height: 60px;
    width: 100%;
    margin-left: 5%;
    display: flex;
    float: left;
    font-weight: bold;
}

.line-info img {
    height: 60px;
    margin-right: 10px;
    margin-left: 0;
}

.line-info h1 {
    display: inline-block;
    font-weight: bold;
    text-align: left;
    width: 100%;
    margin-bottom: 0px;
}

.station-circle {
    display: inline-block;
    position: relative;
    z-index: 2;
    width: 20px;
    height: 20px;
    margin-bottom: 80px;
}

.line-graphic {
    display: block;
    height: 0px;
}

.station-name-wrapper {
    display: block;
    height: 100px;
    background-color: #ece6e6;
}

.station-name {
    display: block;
    width: 100%;
    font-weight: bold;
    margin-bottom: 5px;
    color: rgb(53, 82, 96);
}

.transfer-info {
    width: 100%;
    display: flex;
    justify-content: center;
}

.transfer-info img {
    height: 25px;
    margin-left: 2px;
    margin-right: 2px;

}

.down-train-wrapper,
.up-train-wrapper {
    width: 25%;
    position: relative;
}

.down-train-wrapper .train-img-wrapper {
    right: 0;
}

.up-train-wrapper .train-img-wrapper {
    left: 0;
}

.train-img-wrapper {
    display: flex;
    height: 45px;
    width: 27px;
    position: absolute;
    flex-wrap: wrap;
}

.train-img-wrapper img {
    display: inline-block;
    height: 30px;
}

.train-terminal {
    display: inline-block;
    width: 30px;
    font-size: 5px;
    position: absolute;
}

.down-train-wrapper .train-terminal {
    right: 30px;
}

.up-train-wrapper .train-terminal {
    left: 30px;
}

.direction-icon {
    display: block;
    height: 15px;
    width: 100%;
    margin-bottom: 3px;
}

.normal polygon {
    fill: #ffffff;
}

.lightening polygon {
    fill: #0ec300;
}
</style>