/**
 * Main Application Entry
 */

import { store } from './store.js';
import { initRouter } from './router.js';
import { initCartDrawer } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize State
    store.init();

    // 2. Initialize Routing
    initRouter();

    // 3. Initialize Global Components
    initCartDrawer();

    console.log('[App] Ready');
});
