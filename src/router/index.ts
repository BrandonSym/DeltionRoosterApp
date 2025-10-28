import { createRouter, createWebHistory } from "vue-router"

const routes = [
  {
    path: "/",
    name: "Scanner",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/map-maker",
    name: "MapMaker",
    component: () => import("@/views/MapMakerView.vue"),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
