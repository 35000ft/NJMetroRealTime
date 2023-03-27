<template>
    <div class="main">
        <div class="content">
            <span class="line-wrapper" v-for="(line, index) in lines" :key="index"
                :class="{ 'selected': selectedLine === line.lineCode }" @click="$emit('switchToLine', line.lineCode)">
                {{ line.lineName }}
            </span>
        </div>
    </div>
</template>
<script>

export default {
    name: 'LineSelector',
    components: {

    },
    mixins: [],
    props: {
        selectedLineProp: String,
        lineCodes: [],
    },
    data() {
        return {
            selectedLine: "",
            lines: []
        }
    },
    computed: {
    },
    watch: {
        lineCodes: {
            handler() {
                this.initLines()
            }
        },
        selectedLineProp: {
            handler() {
                if (this.selectedLineProp == undefined) {
                    this.selectedLine = ""
                } else {
                    this.selectedLine = this.selectedLineProp
                }
            }
        }
    },
    mounted() {
        this.initLines()
    },
    methods: {
        initLines() {
            this.$store.dispatch('getLineNames', this.lineCodes).then(lines => {
                this.lines = lines
            })
        }
    }
};
</script>
<style scoped>
.main {
    width: 100%;
    height: 40px;
    background-color: #ffffff;
    overflow-x: scroll;
}

.main ::-webkit-scrollbar {
    width: 0px;
}

.content {
    width: 100%;
    height: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    display: flex;
    flex-wrap: nowrap;
    padding: 0;
}

.line-wrapper {
    display: inline-block;
    width: 75px;
    flex-shrink: 0;
    text-align: center;
    font-weight: bold;
    color: rgb(50, 82, 99);
}

.selected {
    border-bottom: 5px solid #4fad18;
    border-radius: 5px;
}
</style>