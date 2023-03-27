<template>
  <div id="app">
    <LineVue v-if="selectedLine !== undefined" :lineCodeProp="selectedLine" @changeSelectedStation="changeSelectedStation"
      @changeSelectedTrain="changeSelectedTrain" @switchToLastLine="switchToLastLine" @switchToNextLine="switchToNextLine"
      @switchToLine="switchToLine"></LineVue>
    <Transition appear>
      <StationDetail v-if="selectedStation !== ''" :stationNameProp="selectedStation" :rawSelectedLine="selectedLine"
        @closeStationDetail="closeStationDetail"></StationDetail>
    </Transition>

    <TrainDetail v-if="selectedTrain != null" :train="selectedTrain" class="train-detail"
      @closeTrainDetail="closeTrainDetail">
    </TrainDetail>

    <LineSelector class="line-selector" :selectedLineProp="selectedLine" :lineCodes="onServiceLines"
      @switchToLine="switchToLine"></LineSelector>

    <PlanRouteModule></PlanRouteModule>
  </div>
</template>

<script>
import LineVue from './components/LineVue'
import StationDetail from './components/StationDetail'
import TrainDetail from './components/TrainDetail'
import LineSelector from './components/LineSelector'
import PlanRouteModule from './components/PlanRouteModule'


export default {
  name: 'App',
  components: {
    LineVue,
    StationDetail,
    TrainDetail,
    LineSelector,
    PlanRouteModule,
  },
  created() {
    this.loadApplication()
    this.$store.dispatch("loadScheduleVersion")
  },

  mounted() {

  },
  data() {
    return {
      selectedLineIndex: 0,
      selectedStation: '',
      onServiceLines: [],
      selectedTrain: null
    }
  },

  computed: {
    selectedLine() {
      return this.onServiceLines[this.selectedLineIndex]
    },
    totalLineNumber() {
      return this.onServiceLines.length
    }
  },

  methods: {
    loadApplication() {
      this.$axios('./data/application.json')
        .then(response => {
          const data = response.data
          this.onServiceLines = data.onServiceLines
        })
        .catch(error => { console.log(error) })
    },

    switchToLine(lineCode) {
      const index = this.onServiceLines.findIndex(element => element === lineCode)
      if (index === -1) {
        this.selectedLineIndex = 0
        return
      }
      this.selectedLineIndex = index
    },

    switchToLastLine() {
      this.selectedLineIndex = ((this.selectedLineIndex - 1) + this.totalLineNumber) % this.totalLineNumber
    },

    switchToNextLine() {
      this.selectedLineIndex = ((this.selectedLineIndex + 1)) % this.totalLineNumber
    },

    changeSelectedStation(stationName) {
      this.selectedTrain = null
      this.selectedStation = stationName
    },

    closeStationDetail() {
      this.selectedStation = ''
    },

    closeTrainDetail() {
      this.selectedTrain = null
    },

    changeSelectedTrain(train) {
      if (this.selectedStation === '') {
        this.selectedTrain = train
        return
      }

      this.closeStationDetail()
      this.selectedTrain = train

    },

    sendOnServiceLines() {
      this.$bus.$emit('getOnServiceLines', this.onServiceLines)
    }

  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #1c4163;
  height: calc(100vh);
}


.train-detail {
  position: absolute;
  z-index: 100;
  padding: 0;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.v-enter-active {
  animation: station-detail-transition 1s;
}

.v-leave-active {
  animation: station-detail-transition 1s reverse;
}

@keyframes station-detail-transition {
  from {
    transform: translateY(800px);
  }

  to {
    transform: translateY(0px);
  }
}

.line-selector {
  bottom: 0;
  position: fixed;
}
</style>
