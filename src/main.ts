// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import './assets/style.css'
import './assets/coordinates-control.css'

createApp(App).use(router).mount('#app')
