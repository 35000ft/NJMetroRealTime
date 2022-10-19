var app = new Vue({
    el: '#app',
    data: {
        line: "S8",
        firstStation: 28,
        lastStation: 1828,
        perSegment: 100,    //每站移动100px
        lastStationId: -1,
        names: [],
        up: "",
        down: "",
        direction: "",
        stationInfo: {
            id: "",
            name: "",   //站名
            trains: []
        }
    },
    methods: {
        reverseDirection() {
            if (this.direction == this.down) {
                this.direction = this.up;
            } else {
                this.direction = this.down;
            }
        },

        resetStationStyle() {
            if (this.stationInfo.id == "") {
                this.stationInfo.id = 0;
            }
            let s = document.getElementById(this.stationInfo.id).firstChild.firstChild;
            s.setAttribute("fill", "none");
        },
        setStationStyle(station) {
            this.resetStationStyle();
            let s = station.firstChild.firstChild;
            s.setAttribute("fill", "#EA7600");
        },

        getStationInfo(index, lastStationId) {
            this.lastStationId = lastStationId;
            // this.setStationStyle(event.currentTarget);
            // this.stationInfo.id = index;
            this.stationInfo.id = index;
            this.stationInfo.name = this.names[index];
            this.stationInfo.trains = [];
            this.stationInfo.trains.push({ 'status': '加载中...', 'eta': 'Loading...' });
        },

        async loadStationNames() {
            const url = './assets/lineInfo/' + this.line + '.json';
            console.log("loading " + url);
            this.names = await axios.get(url).then(res => {
                return res.data.names;
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        },

        async loadTimeTable(url) {
            let data = await axios.get(url).then(res => {
                return res.data;
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
            return data;
        },

        getTimeTable(isUp, timetable) {
            if (this.isWorkDay()) {
                //工作日 上/下行
                return isUp ? timetable.up_workday : timetable.down_workday;
            } else {
                //休息日 上/下行
                return isUp ? timetable.up_weekend : timetable.down_weekend;
            }
        },

        setTrainTime() {
            //res为该站时刻表 3s刷新一次
            let data;
            let flag = true;//判断是否要执行第二个getLatestTrainTime ,如果重新加载时刻表，第二个就不用执行
            setInterval(() => {

                if (this.stationInfo.id === "" || parseInt(this.stationInfo.id) < 0) {
                    return;
                }

                //如果站点发生改变则重新加载时刻表
                // console.log(this.lastStationId != parseInt(this.stationInfo.id));
                if (this.lastStationId == "" || this.lastStationId != parseInt(this.stationInfo.id)) {
                    this.lastStationId = parseInt(this.stationInfo.id);
                    let stationId = this.lastStationId + 1
                    if (stationId < 10) {
                        stationId = '0' + stationId//5 -> 05
                    }
                    console.log("loading " + this.line + stationId + '.json')
                    let fileName = './assets/timetable/' + this.line + stationId + '.json';

                    //由于stationId发生了改变，要赋回原来的值，否则会一直重新加载时刻表
                    // stationId = this.stationInfo.id;
                    flag = false;
                    this.loadTimeTable(fileName).then(res => {
                        data = res;
                        this.getLatestTrainTime(data, this.direction == this.up, 3);
                    });
                }

                //如果时刻表已加载才会获取列车时间
                if (flag && typeof (data) != "undefined") {
                    this.getLatestTrainTime(data, this.direction == this.up, 3);
                } else {
                    flag = true;
                }
            }, 3000);
        },

        getCurrentIndex(_timetable, _t) {
            let start = 0;
            let end = _timetable.length

            if (_t < _timetable[start]) {
                //如果当前时间在首班车前
                return start;
            } else if (_t > _timetable[end - 1]) {
                //如果当前时间在末班车后
                return -1;
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

        getLatestTrainTime(timetable, isUp, trainNumber) {
            let _timetable = this.getTimeTable(isUp, timetable);
            // if (this.isWorkDay()) {
            //     //工作日 上/下行
            //     _timetable = isUp ? timetable.up_workday : timetable.down_workday;
            // } else {
            //     //休息日 上/下行
            //     _timetable = isUp ? timetable.up_weekend : timetable.down_weekend;
            // }

            this.stationInfo.trains = [];
            let _now = this.getFormatTime();
            //获取当前时间在时刻表的位置
            let currentIndex = this.getCurrentIndex(_timetable, _now);
            if (currentIndex === -1) {
                train['status'] = "已过末班";
                train['eta'] = "No Train";
                return;
            }


            for (i = 0; i < trainNumber; i++) {
                _t = _timetable[currentIndex + i];
                console.log(i + ':' + _t);
                let train = {}
                if (typeof (_t) == "undefined") {
                    return;
                }
                train['eta'] = _t;

                let nowtime = new Date();
                let remainMin = this.calcRemainMins(_now, _timetable[currentIndex + i]);
                if (remainMin == 0) {
                    if (nowtime.getSeconds() < 15) {
                        train['status'] = "即将到达";
                    } else {
                        train['status'] = "车已到站";
                    }
                } else train['status'] = this.calcRemainMins(_now, train['eta']) + '分钟';

                this.stationInfo.trains.push(train);
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

        //判断是否为工作日
        isWorkDay() {
            let nowtime = new Date();
            if (nowtime.getDay() === 0 || nowtime.getDay() === 6) {
                return false;
            }
            return true;
        },

        //移动列车
        //@Param step: 移动像素数
        //@Param trainId :移动的列车id
        // move(step, trainId) {
        //     let train = document.getElementById(trainId);
        //     let o_left = parseInt(train.style.left);
        //     if (o_left >= this.lastStation) {
        //         return;
        //     }
        //     let next_left = o_left + step;
        //     train.style.left = next_left + "px";
        // },

        // calcStep(preStation, nestStation) {

        // },

        // moveTrain() {
        //     setInterval(() => {
        //         this.move(1, "S8-001");
        //     }, 25);
        // },

        // setTrain() {

        // }
        init() {
            const url = './assets/lineInfo/' + this.line + '.json';
            console.log("loading " + url);
            axios.get(url).then(res => {
                this.names = res.data.names;
                this.up = res.data.direction.up;
                this.down = res.data.direction.down;
                //设置默认为下行
                this.direction = this.down;

                const mapFrame = this.$refs['stationIframe'];
                mapFrame.onload = (function () {
                    const iframeWin = mapFrame.contentWindow;
                    iframeWin.postMessage(res.data.names, '*');
                })
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        }
    },
    created() {
        this.init();
        this.setTrainTime();
    },
    mounted() {
        window.getStationInfo = this.getStationInfo;
    }
})
