<template>
    <div class="modal-box">
        <div class="modal-box-top">
            <span>
                <img :src="`${publicPath}icon/refresh.png`" alt="" :class="{ 'refresh': isRefreshing }"
                    @click="handleRefresh" @animationend="resetRefresh">
            </span>
            <span @click="$emit('closeTrainDetail')">
                <img :src="`${publicPath}icon/close.png`" alt="">
            </span>
        </div>

        <div class="modal-box-header">
            <div>
                <table>
                    <tr>
                        <td rowspan="2">
                            <span class="train-type-wrapper">
                                <!-- 车别图标 普通/区间/快速/贯通/直达 -->
                                <img :src="'./icon/train-type/' + trainType">
                            </span>
                        </td>
                        <td class="current-location">当前位置: {{ train.location }}</td>
                    </tr>
                    <tr>
                        <td class="train-terminal"> {{ train.terminal }}</td>
                    </tr>
                </table>
            </div>
        </div>
        <div class="modal-box-schedule">
            <div class="schedule-header">
                <span class="station-name"><b>停车站</b> </span>
                <span class="arrival-time"><b>到达时间</b> </span>
                <span class="triangle-icon">&nbsp;</span>
                <span class="depart-time"><b>出发时间</b></span>
            </div>
            <div class="schedule-content">
                <div class="schedule-item" v-for="(item, index) in schedule" :key="index">
                    <span class="station-name">{{ item.station }}</span>
                    <span class="arrival-time">{{ item.arrivalTime }}</span>
                    <span class="triangle-icon" :class="item.triangleClass">
                        <svg width="7.5px" height="15px">
                            <polygon points="0,0 0,15 7.5,7.5" />
                        </svg>
                    </span>
                    <span class="depart-time">{{ item.departTime }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: 'TrainDetail',
    components: {

    },
    mixins: [],
    props: ['train'],
    data() {
        return {
            // 车号
            regNumber: '',
            schedule: [],
            isRefreshing: false,
            publicPath: process.env.BASE_URL,
        }
    },
    computed: {
        trainType() {
            return this.$constant.Business.TRAIN_LEVEL_ICON_TABLE[this.train.level.toString()]
        },

    },
    watch: {
        train: {
            handler() {
                this.calcSchedule()
            },
            deep: true
        }
    },
    mounted() {
        this.calcSchedule()
    },
    methods: {
        calcSchedule() {
            const rawSchedule = this.train.schedule
            this.schedule.splice(0)
            rawSchedule.forEach(item => {
                if (item.arrivalTime === "......") return

                let temp = {}
                //根据车站id获取车站名
                temp.station = this.$constant.Static.STATIONS[item.stationId.toString()]
                temp.arrivalTime = this.$constant.Business.formatTime(item.arrivalTime)
                temp.departTime = this.$constant.Business.formatTime(item.departTime)
                temp.triangleClass = this.formatTriangleClass(temp, this.schedule)

                this.schedule.push(temp)
            })
        },
        formatTriangleClass(item, schedule) {
            const isAfter = this.$constant.Business.isAfter
            if (!isAfter(item.departTime)) {
                return "passed"
            } else if (isAfter(item.arrivalTime)) {
                if (schedule.length === 0 || !isAfter(schedule.slice(-1)[0].departTime))
                    return "next"
                else if (isAfter(schedule.slice(-1)[0].departTime))
                    return "future"
            } else {
                return "next"
            }
        },

        handleRefresh() {
            this.isRefreshing = true
        },

        resetRefresh() {
            this.isRefreshing = false
        },
    }
};
</script>
<style scoped>
.modal-box {
    width: 20rem;
    background-color: #dddddd;
    height: calc(50vh);
    border: 3px solid rgb(146, 146, 146);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

}

.modal-box-top {
    height: 10%;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 5px
}

.modal-box-top span {
    display: inline-flex;
    height: 80%;
    margin-left: 2px;
    margin-right: 2px;
}

.modal-box-top img {
    height: 100%;
}

.modal-box-header {
    height: 20%;
    width: 100%;
    padding-left: 10px;
    display: flex;
}

.modal-box-header table {
    display: inline-block;
    text-align: left;
}

.modal-box-schedule {
    height: 70%;
    width: 100%;
    background-color: #eeeeee;
    overflow: hidden;
}

.modal-box-schedule table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
}

.modal-box-schedule table tr,
th {
    display: flex;
    justify-content: space-around;
}

.modal-box-schedule table td {
    padding-right: 5px;
    padding-left: 5px;
    text-align: center;
}

.train-type-wrapper {
    display: inline-block;
}


.train-type-wrapper img {
    height: 50px;
}

.current-location {
    color: #8b8b8b;
}

.train-terminal {
    color: #00314d;
    font-weight: bold;
}

.schedule-header {
    margin-left: 3px;
    margin-right: 2px;
}

.schedule-header span {
    display: inline-block;
    height: 25px;
    font-size: 14px;
    border-bottom: 1px #004b77 solid;
}

.station-name {
    text-align: left;
    width: 50%;
}

.arrival-time {
    text-align: center;
    width: 22.5%;
}

.triangle-icon {
    width: 5%;
    display: flex;
    justify-content: center;
}

.passed polygon {
    fill: rgb(187, 17, 17);
}

.next polygon {
    fill: rgb(233, 168, 28);
}

.future polygon {
    fill: rgb(22, 163, 22);
}

.triangle-icon img {
    height: 15px;
}


.depart-time {
    text-align: center;
    width: 22.5%;
}

.schedule-content {
    height: 90%;
    margin-left: 3px;
    margin-right: 2px;
    overflow-x: hidden;
    overflow-y: scroll;
}

.schedule-content span {
    display: inline-block;
    height: 25px;
    font-size: 14px;
    border-bottom: 1px #b3b3b3 solid;
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
</style>