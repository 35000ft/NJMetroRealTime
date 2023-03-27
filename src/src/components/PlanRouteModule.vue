<template>
    <div>
        
    </div>
</template>
<script>
import { dijkstra } from '@/constant/algorithm'
import { GRAPH } from '@/constant/graph';
export default {
    name: 'PlanRouteModule',
    components: {

    },
    mixins: [],
    props: {

    },
    data() {
        return {
            fromStation: '',
            toStation: '',
        }
    },
    computed: {

    },
    watch: {

    },
    mounted() {

    },
    methods: {
        calcRoute() {
            let x = dijkstra(GRAPH, "8", "181")
            console.log(x)
        }
    }
};
</script>
<style scoped></style>