var app = new Vue({
    el: '#app',
    data: {
        line: "S8",
        firstStation: 28,
        lastStation: 1828,
        perSegment: 100,    //每站移动100px
        names: ["金牛湖", "八百桥", "沈桥", "方州广场", "凤凰山公园", "雄州", "龙池", "六合开发区", "化工园", "长芦", "葛塘", "大厂", "卸甲甸", "信息工程大学", "高新开发区", "泰冯路", "泰山新村", "毛纺厂路", "长江大桥北"],
        stationInfo: {
            id: "",
            name: "",   //站名
            trains: []
        }   //最近的n辆车
    },
    methods: {
        resetStationStyle() {
            if (this.stationInfo.id == "") {
                return;
            }
            this.stationInfo.name = "";
            let s = document.getElementById(this.stationInfo.id).firstChild.firstChild;
            s.setAttribute("fill", "none");
        },
        setStationStyle(station) {
            this.resetStationStyle();
            let s = station.firstChild.firstChild;
            s.setAttribute("fill", "#EA7600");
        },

        getStationInfo(event, index) {
            //设置样式
            this.setStationStyle(event.currentTarget, index);
            this.stationInfo.id = index;
            this.stationInfo.name = this.names[index];
            this.stationInfo.trains = [];
            this.stationInfo.trains.push({ 'status': '加载中...', 'eta': 'Loading...' });
            this.setTrainTime(index);
        },

        async loadTimeTable(url) {
            let data = await axios.get(url).then(res => {
                return res.data;
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
            return data;
        },

        setTrainTime() {
            //res为该站时刻表 3s刷新一次
            let stationId = "";
            let data;
            setInterval(() => {
                //如果站点发生改变则重新加载时刻表
                if (stationId != this.stationInfo.id) {
                    stationId = parseInt(this.stationInfo.id);
                    stationId += 1;//0 -> 1 
                    if (stationId < 10) {
                        stationId = '0' + stationId//5 -> 05
                    }
                    console.log("loading " + this.line + stationId + '.json')
                    let fileName = './assets/timetable/' + this.line + stationId + '.json';

                    //由于stationId发生了改变，要赋回原来的值，否则回一直重新加载时刻表
                    stationId = this.stationInfo.id;

                    this.loadTimeTable(fileName).then(res => {
                        data = res;
                        this.getLatestTrainTime(data, false, 3);
                    });
                }

                //如果时刻表已加载才会获取列车时间
                if (typeof (data) != "undefined") {
                    this.getLatestTrainTime(data, false, 3);
                }
            }, 3000);
        },

        getCurrentIndex(_timetable, _t) {
            let start = 0;
            let end = _timetable.length
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
            let _timetable;
            if (this.isWorkDay()) {
                //工作日 上/下行
                _timetable = isUp ? timetable.up_workday : timetable.down_workday;
            } else {
                //休息日 上/下行
                _timetable = isUp ? timetable.up_weekend : timetable.down_weekend;
            }

            this.stationInfo.trains = [];
            let _now = this.getFormatTime();
            //获取当前时间在时刻表的位置
            let currentIndex = this.getCurrentIndex(_timetable, _now);

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
    },
    created() {
        // this.moveTrain();
    }
})
