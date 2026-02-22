import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Timoria from '@/views/Timoria.vue'
import AboutView from '@/views/AboutView.vue'
import Login from '@/views/Login.vue'
import Signup from '@/views/Signup.vue'
import Stats from '@/views/Stats.vue'
import UserAccount from '@/views/UserAccount.vue'
import Privacy from '@/views/Privacy.vue'
import License from '@/views/License.vue'
import ServiceDetail from "@/views/ServiceDetail.vue";
import Contact from "@/views/Contact.vue";
import i18n from '@/i18n'
import Leaderboard from '@/views/Leaderboard.vue'
import BudgetControl from '@/views/BudgetControl.vue'
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

const DEFAULT_TITLE = 'TechTonic'; // Your app's default name



const routes = [
  { path: '/', name: 'home', component: HomeView, meta:{titleKey: 'tab.homepage'} },
  { path: '/about', component: AboutView, meta:{titleKey: 'tab.about'} },
  { path: '/timoria', component: Timoria, meta:{titleKey: 'tab.timoria'} },
  { path: '/login', component: Login, meta:{titleKey: 'tab.login'} },
  { path: '/signup', component: Signup, meta:{titleKey: 'tab.signup'} },
  { path: '/statistics', component: Stats, meta:{titleKey: 'tab.statistics'} },
  { path: '/leaderboard', component: Leaderboard, meta:{titleKey: 'tab.leaderboard'} },
  { path: '/account', component: UserAccount, meta:{titleKey: 'tab.account'} },
  { path: '/privacy', component: Privacy, meta:{titleKey: 'tab.privacy'} },
  { path: '/license', component: License, meta:{titleKey: 'tab.license'} },
  { path: '/contact', component: Contact, meta:{titleKey: 'tab.contact'} },
  { path: '/budget', component: BudgetControl, meta:{titleKey: 'tab.budget'} },
  { path: "/services/:service", name: "ServiceDetail", component: ServiceDetail, meta:{titleKey: 'tab.ourServices'} },
]
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})
router.beforeEach((to, from, next) => {
  // 1. Get the title key from the route meta
  const titleKey = to.meta.titleKey;

  // 2. If a key exists, translate it and set the document title
  if (titleKey) {
    // accessing the global translation function
    const title = i18n.global.t(titleKey); 
    document.title = `${title} | ${DEFAULT_TITLE}`;
  } else {
    // 3. Fallback if no title is defined
    document.title = DEFAULT_TITLE;
  }

  next();
});
export default router
