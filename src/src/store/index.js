//该文件用于创建vuex最核心的store实例

import Vue from 'vue'
//引入vuex
import Vuex from 'vuex'

import axios from 'axios'

import constant from '../constant/'

Vue.use(Vuex)
//用于响应组件中的动作
const actions = {
    async getOnServiceTrains(context, lineCode) {
        console.log('获取' + lineCode + '在线列车中')
        let lineSchedule = await context.dispatch("loadLineSchedule", lineCode)

        lineSchedule = Array.from(Object.values(lineSchedule))

        const onServiceTrains = lineSchedule.filter(train => {
            const firstArrivalTime = train.schedule[0].arrivalTime
            const terminalDepartTime = train.schedule.slice(-1)[0].departTime
            const isAfter = constant.Business.isAfter
            return !isAfter(firstArrivalTime) && isAfter(terminalDepartTime)
        })

        return new Promise((resolve) => {
            resolve(onServiceTrains)
        })
    },

    //获取某车站的某线路的时刻表
    async getStationSchedule(context, [stationId, lineCode]) {
        console.log('获取' + stationId + '站' + lineCode + '线 的时刻表中')

        let lineSchedule = await context.dispatch("loadLineSchedule", lineCode)
        if (lineSchedule == null) {
            console.log('获取' + lineCode + '线时刻表失败')
            return null
        }

        let trains = []
        lineSchedule =
            //转为数组
            Array.from(Object.values(lineSchedule))
                .filter(train => {
                    if (constant.Business.TRAIN_LEVEL_TABLE[train.level.toString()] === "贯通") {
                        return true
                    }

                    let pattern = '^' + lineCode + '-'
                    return train.trainId.match(pattern) != null
                })
                //筛选出时刻表包含该站的列车
                .filter(train => {
                    stationId = stationId.toString()
                    let pattern = '(-' + stationId + '-)|(^' + stationId + '-)|(-' + stationId + '$)'
                    return train.route.match(pattern) != null
                })

        lineSchedule.forEach(train => {
            const schedule = train.schedule.find(e => e.stationId === Number(stationId))

            trains.push({
                trainNumber: train.trainId,
                direction: train.direction,
                level: train.level,
                terminal: train.route.split('-').slice(-1)[0],
                departTime: schedule.departTime,
                arrivalTime: schedule.arrivalTime,
                isTerminal: train.route.match('(-' + stationId + '$)') != null,
                isOriginating: train.route.match('(^' + stationId + '-)') != null,
            })
        })

        return new Promise(resolve => {
            resolve(trains)
        })
    },

    async getLineStationNames(context, lineCode) {
        let lineInfo = await context.dispatch("loadLineInfo", lineCode)
        return new Promise((resolve) => {
            resolve(lineInfo.stationNames)
        })
    },

    async getLineNames(context, lineCodes) {
        let result = []
        for (let index = 0; index < lineCodes.length; index++) {
            const lineCode = lineCodes[index];
            await context.dispatch("loadLineInfo", lineCode).then(lineInfo => {
                result.push({
                    lineCode: lineCode,
                    lineName: lineInfo.lineName,
                    lineColor: lineInfo.lineColor,
                })
            })
        }

        return new Promise((resolve) => {
            resolve(result)
        })
    },

    //加载线路时刻表
    async loadLineSchedule(context, lineCode) {
        if (state.scheduleVersion == null) {
            await context.dispatch('loadScheduleVersion')
        }

        if (!(lineCode in state.scheduleVersion)) return null

        //如果已有lineCode的数据则直接返回
        if (state.lineData.has(lineCode)) {
            return new Promise((resolve) => {
                resolve(state.lineData.get(lineCode))
            })
        }

        let version = state.scheduleVersion[lineCode]

        //判断是工作日还是节假日
        const isWorkDay = () => {
            const now = new Date()
            return !(now.getDay() === 0 || now.getDay() === 6)
        }

        //当前线路时刻表的版本
        version = isWorkDay() ? version["workday"] : version["restday"]

        await axios('./data/schedules/' + lineCode + '-train-schedule-' + version + '.json')
            .then(response => {
                context.commit("loadLineSchedule", [lineCode, response.data])
            })
            .catch(error => { console.log(error) })

        return new Promise((resolve) => {
            resolve(state.lineData.get(lineCode))
        })
    },

    //加载时刻表版本
    async loadScheduleVersion(context) {
        await axios('./data/schedule-version-config.json')
            .then(response => {
                context.commit('loadScheduleVersion', response.data)
            })
            .catch(error => { console.log(error) })
    },

    async loadLineInfo(context, lineCode) {
        //如果已有lineCode的数据则直接返回
        if (state.lineInfo.has(lineCode)) {
            return new Promise((resolve) => {
                resolve(state.lineInfo.get(lineCode))
            })
        }

        await axios('./data/lines/' + lineCode + '.json')
            .then(response => {
                context.commit("loadLineInfo", [lineCode, response.data])
            })
            .catch(error => { console.log(error) })

        return new Promise((resolve) => {
            resolve(state.lineInfo.get(lineCode))
        })
    }
}

//用于操作数据
const mutations = {
    loadScheduleVersion(state, data) {
        state.scheduleVersion = data
    },

    loadLineSchedule(state, data) {
        //data[0]:lineCode data[1]:线路时刻表
        state.lineData.set(data[0], data[1])
    },

    loadLineInfo(state, [lineCode, data]) {
        state.lineInfo.set(lineCode, data)
    }

}

//用于存储数据
const state = {
    lineData: new Map(),
    lineInfo: new Map(),
    scheduleVersion: null
}

//创建并暴露store
export default new Vuex.Store({
    actions,
    mutations,
    state
})


