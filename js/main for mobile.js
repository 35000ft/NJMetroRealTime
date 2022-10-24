var app = new Vue({
    el: '#app',
    data: {
        line: "S8",
        stations: [],
        directionText: "",
        direction: false,
        assertsPath: "./assets/"
    },
    methods: {

        reverseDirection() {

            this.direction = !this.direction;
            this.directionText = this.direction ? this.stations[0].name : this.stations[this.stations.length - 1].name;
            window.stationIframe.reverseDirection();
        },

        init() {
            const url = this.assertsPath + 'lineInfo/' + this.line + '.json';
            console.log("loading " + url);
            axios.get(url).then(res => {
                let names = res.data.names;
                for (i = 0; i < names.length; i++) {
                    this.stations.push({ "index": i, "name": names[i] });
                }
                this.directionText = this.stations[this.stations.length - 1].name;

                const mapFrame = this.$refs['stationIframe'];
                mapFrame.onload = (function () {
                    const iframeWin = mapFrame.contentWindow;
                    iframeWin.postMessage(res.data, '*');
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
        
        window.reverseDirection = this.reverseDirection;
    }
})