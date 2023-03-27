import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
Vue.prototype.$axios = axios

//必须先Vue.use(Vuex)才能创建store实例
import store from './store/index.js'

import Constant from './constant/index.js'

import VueTouch from "vue-touch"
Vue.use(VueTouch, { name: "v-touch" })

import VueRouter from 'vue-router'
Vue.use(VueRouter)

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// 引入bootstrap css
import 'bootstrap/dist/css/bootstrap.css'
// 引入bootstrap-vue css
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)


Vue.config.productionTip = false

import router from './router'
import register from './registerServiceWorker'

//创建vm
new Vue({
  el: "#app",
  render: h => h(App),
  store: store,
  router: router,
  beforeCreate() {
    //设置事件总线
    Vue.prototype.$bus = this
    Vue.prototype.$constant = Constant
  }
})
register();