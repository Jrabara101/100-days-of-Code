/**
 * Router Module
 * Handles client-side navigation via Hash (SPA Style)
 */

import { renderCatalog } from './catalog.js';
import { renderProductDetail } from './product-detail.js';
import { renderCartPage } from './cart.js';
import { renderCheckout } from './checkout.js';

const routes = {
    '/': renderCatalog,
    '/product': renderProductDetail,
    '/cart': renderCartPage,
    '/checkout': renderCheckout
};

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    console.log(`[Router] Navigating to: ${hash}`);

    const app = document.getElementById('app');

    // Parse route and params (e.g., /product?id=123)
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);

    const renderer = routes[path];

    if (renderer) {
        // Clear previous content (in a real app, maybe sophisticated diffing)
        // app.innerHTML = ''; // Let renderer decide if it needs full wipe or reusable components
        renderer(app, params);
        window.scrollTo(0, 0);
    } else {
        app.innerHTML = `<div class="p-10 text-center text-2xl">404 - Page Not Found</div>`;
    }
}

export function navigateTo(path) {
    window.location.hash = path;
}
