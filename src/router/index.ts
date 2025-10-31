import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";

// Component imports
import Homepage from "../components/Homepage.vue";
import Login from "../components/Login.vue";
import Roster from "../components/Roster.vue";
import Profile from "../components/Profile.vue";
import Settings from "../components/Settings.vue";
import NotFound from "../components/NotFound.vue";

// Define routes
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", name: "Home", component: Homepage },
      { path: "rooster", name: "Rooster", component: Roster },
      { path: "profiel", name: "Profile", component: Profile },
      { path: "instellingen", name: "Settings", component: Settings },
    ],
  },
  {
    path: "/login", 
    name: "Login",
    component: Login,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
];

// Create and export router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
