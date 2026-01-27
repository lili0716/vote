// import './assets/main.css'

import { createApp } from 'vue'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { pinia } from './stores/pinia'

const app = createApp(App)

pinia.use(createPersistedState())

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')
