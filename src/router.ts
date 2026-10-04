// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Keep the paths stable, such that existing links/bookmarks (e.g. in the manual in doc/manual) keep working.
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    sessionPage?: boolean // shows data of a specific session given by query parameter session_id
  }
}

const WEATHER_TITLE = 'Weather tools'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView, meta: { title: 'Home' } },
    { path: '/tools/weather_qfe', component: () => import('@/views/WeatherView.vue'), meta: { title: WEATHER_TITLE } },
    { path: '/tools/weather_qnh', redirect: '/tools/weather_qfe' },
    {
      path: '/ongoing_session/sessions_list',
      component: () => import('@/views/SessionsListView.vue'),
      meta: { title: 'List of available Sessions' },
    },
    {
      path: '/ongoing_session/current_session',
      component: () => import('@/views/SessionDetailsView.vue'),
      meta: { title: 'Session Details', sessionPage: true },
    },
    {
      path: '/ongoing_session/damages',
      component: () => import('@/views/DamagesView.vue'),
      meta: { title: 'Damage and Hits', sessionPage: true },
    },
    {
      path: '/ongoing_session/attacker_events',
      component: () => import('@/views/AttackerEventsView.vue'),
      meta: { title: 'Attacker Events', sessionPage: true },
    },
    {
      path: '/ongoing_session/missile_events',
      component: () => import('@/views/MissileEventsView.vue'),
      meta: { title: 'Missile Events', sessionPage: true },
    },
    {
      path: '/ongoing_session/positions_list',
      component: () => import('@/views/PositionsListView.vue'),
      meta: { title: 'List of Attacker and Target Positions', sessionPage: true },
    },
    {
      path: '/ongoing_session/positions_map',
      component: () => import('@/views/PositionsMapView.vue'),
      meta: { title: 'Map of Attacker and Target Positions', sessionPage: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - Hunter Web UI` : 'Welcome to the Hunter Web UI'
})

export default router
