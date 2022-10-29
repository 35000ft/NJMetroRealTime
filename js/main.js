var app = new Vue({
    el: '#app',
    data: {
        lines: [{
            value: 'S1',
            label: 'S1机场线'
        },
        {
            value: 'S8',
            label: 'S8宁天线'
        }],
        line: "S1",
        lineName: "",
        color: "",
        stations: [],
        directionText: "",
        direction: false,
        assertsPath: "./assets/"
    },
    methods: {
        switchLine(event) {
            let line = event.target.value;
            if (line == this.line) {
                return;
            }
            this.line = line;
            this.init();
            window.stationIframe.switchLine(line);
        },

        reverseDirection() {
            this.direction = !this.direction;
            this.directionText = this.direction ? this.stations[0].name : this.stations[this.stations.length - 1].name;
            window.stationIframe.reverseDirection();
        },

        init() {
            const url = this.assertsPath + 'lineInfo/' + this.line + '.json';
            console.log("loading " + url);
            axios.get(url).then(res => {
                this.direction = false;
                this.stations = []
                this.lineName = res.data.lineName;
                this.stations = [];
                this.direction = false;
                let names = res.data.stations;
                for (i = 0; i < names.length; i++) {
                    this.stations.push({ "index": i, "name": names[i] });
                }
                this.directionText = this.stations[this.stations.length - 1].name;
                this.color = res.data.color;
                this.line = res.data.line;
                const mapFrame = this.$refs['stationIframe'];
                mapFrame.onload = (function () {
                    const iframeWin = mapFrame.contentWindow;
                    iframeWin.postMessage(res.data.line, '*');
                });
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        },

    },
    created() {
        this.init();
    },
    mounted() {
        window.switchLine = this.switchLine;
        window.reverseDirection = this.reverseDirection;
    }
})
