var app = new Vue({
    el: '#app',
    data: {
        lines: [],
        line: "L1",
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
        async loadConfig() {
            const url = './config.json';
            console.log("loading " + url);
            axios.get(url).then(res => {
                this.lines = res.data.lines;
                console.log("load " + url + " successfully");
            }, () => {
                console.log('Load ' + url + ' Error!');
            })
        },

        async init() {
            await this.loadConfig();
            const url = this.assertsPath + 'lineInfo/' + this.line + '.json';
            console.log("loading " + url);
            axios.get(url).then(res => {
                this.direction = false;
                this.stations = []
                this.lineName = res.data.lineName;
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
        registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                    .register('./sw.js')
                    .then(() => { console.log('Service Worker Registered'); });
            }
        },
        addToDesktop() {
            let deferredPrompt;
            const addBtn = document.querySelector('.add-button');
            addBtn.style.display = 'none';

            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent Chrome 67 and earlier from automatically showing the prompt
                e.preventDefault();
                // Stash the event so it can be triggered later.
                deferredPrompt = e;
                // Update UI to notify the user they can add to home screen
                addBtn.style.display = 'block';

                addBtn.addEventListener('click', () => {
                    // hide our user interface that shows our A2HS button
                    addBtn.style.display = 'none';
                    // Show the prompt
                    deferredPrompt.prompt();
                    // Wait for the user to respond to the prompt
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the A2HS prompt');
                        } else {
                            console.log('User dismissed the A2HS prompt');
                        }
                        deferredPrompt = null;
                    });
                });
            });
        },
    },
    created() {
        this.init();
        this.registerServiceWorker();
    },
    mounted() {
        window.switchLine = this.switchLine;
        window.reverseDirection = this.reverseDirection;
    }
})