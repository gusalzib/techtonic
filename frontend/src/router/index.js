import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Timoria from '@/views/Timoria.vue'
import AboutView from '@/views/AboutView.vue'

// const routes = [
//   {
//     path: '/',
//     name: 'home',
//     component: HomeView
//   },
//   {
//     path: '/timoria',
//     name: 'Timoria',
//     component: Timoria
//   },
//   {
//     path: '/about',
//     name: 'about',
//     // route level code-splitting
//     // this generates a separate chunk (about.[hash].js) for this route
//     // which is lazy-loaded when the route is visited.
//     component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
//   }
// ]
const routes = [
  {     path: '/', name: 'home', component: HomeView },
  { path: '/about', component: AboutView },
  { path: '/timoria', component: Timoria }
]
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
