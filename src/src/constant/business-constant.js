import moment from "moment"

export const t0 = "04:00:00"

export const getNowTime = () => {
    return moment(new Date()).format("HH:mm:ss")
}

//target时间是否在当前时间之后
export const isAfter = (target) => {
    const now = getNowTime()

    if (target < t0 && now > t0) {
        return true
    } else if (target > t0 && now < t0) {
        return false
    } else {
        return now < target
    }
}

export const timeCmp = (t1, t2) => {
    if ((t1 >= t0 && t2 >= t0) || (t1 < t0 && t2 < t0)) {
        return t1.localeCompare(t2)
    } else if (t1 < t0 && t2 > t0) {
        return 1
    } else if (t2 < t0 && t1 > t0) {
        return -1
    }
}

//将HH:mm:ss 四舍五入为 HH:mm
export const formatTime = (time) => {
    let t = moment(time, "HH:mm:ss")
    const seconds = t.second()
    if (seconds >= 30) {
        t.add(1, 'minute')
    }
    return t.format('HH:mm')
}

export const TRAIN_LEVEL_TABLE = {
    "0": "普通",
    "1": "区间",
    "2": "快速",
    "3": "贯通",
    "4": "区间/回送",
    "5": "直达",
    "6": "区间/出库",
}

export const TRAIN_LEVEL_ICON_TABLE = {
    "0": "普通.png",
    "1": "区间.png",
    "2": "快速.png",
    "3": "贯通.png",
    "4": "区间.png",
    "5": "直达.png",
    "6": "区间.png",
}


export const LOADING_TRAIN = {
    terminal: "加载中...",
    status: "Loading...",
    etd: "/",
    type: "/"
}

export const ERROR_TRAIN = {
    terminal: "加载失败",
    status: "Fail Loading",
    etd: "/",
    type: "/"
}



export const UPDATE_STATION_FREQUENCY = 5000