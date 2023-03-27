//用于创建应用的路由器
import VurRouter from 'vue-router'

import StationVue from '../components/StationVue'

//创建并暴露路由器
export default new VurRouter({
    routes: [
        {
            path: '/station',
            component: StationVue
        },
    ]
})
