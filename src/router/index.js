import { createRouter, createWebHistory } from 'vue-router'
import Main from '../views/Main.vue'

const routerHistory = createWebHistory()

const routes = [
    {
        path: '/',
        component: Main
    }
]

const router = createRouter({
    history: routerHistory,
    routes,
})

export default router;