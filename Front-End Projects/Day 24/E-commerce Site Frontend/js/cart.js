/**
 * Cart Module
 * Handles floating drawer and Cart Page logic
 */

import { store } from './store.js';
import { navigateTo } from './router.js';

export function initCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');

    // Drawer Render Function
    const renderDrawer = () => {
        const cart = store.state.cart;
        const isEmpty = cart.length === 0;

        drawer.innerHTML = `
            <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 class="text-xl font-bold">Shopping Cart (${store.getCartCount()})</h2>
                <button id="close-drawer" class="text-gray-500 hover:text-red-500 text-xl">&times;</button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                ${isEmpty ? `
                    <div class="flex flex-col items-center justify-center h-full text-gray-500">
                        <i class="fa-solid fa-cart-shopping text-4xl mb-3 text-gray-300"></i>
                        <p>Your cart is empty.</p>
                        <button onclick="window.location.hash='/'" class="mt-4 text-primary-500 font-bold hover:underline">Start Shopping</button>
                    </div>
                ` : cart.map(item => `
                    <div class="flex gap-4 p-3 bg-white border rounded-lg shadow-sm">
                        <img src="${item.image}" class="w-16 h-16 object-cover rounded-md bg-gray-100">
                        <div class="flex-1">
                            <h4 class="font-medium text-sm line-clamp-1">${item.name}</h4>
                            <p class="text-xs text-gray-500 mb-1">${store.formatCurrency(item.price)}</p>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 border rounded px-2 py-1 bg-gray-50 text-xs">
                                    <button class="px-1 hover:text-primary-500 update-qty" data-id="${item.id}" data-qty="${item.quantity - 1}">-</button>
                                    <span>${item.quantity}</span>
                                    <button class="px-1 hover:text-primary-500 update-qty" data-id="${item.id}" data-qty="${item.quantity + 1}">+</button>
                                </div>
                                <button class="text-gray-400 hover:text-red-500 remove-item" data-id="${item.id}">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${!isEmpty ? `
                <div class="p-4 border-t bg-gray-50 space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Subtotal</span>
                        <span class="font-bold">${store.formatCurrency(store.getCartTotal())}</span>
                    </div>
                    <button id="checkout-btn" class="w-full bg-primary-500 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-primary-600 transition-colors">
                        Checkout Now
                    </button>
                    <button class="w-full text-gray-500 text-sm hover:text-gray-700" onclick="window.location.hash = '/cart'">View Cart Details</button>
                </div>
            ` : ''}
        `;

        // Wire Events
        drawer.querySelector('#close-drawer').addEventListener('click', toggleDrawer);

        drawer.querySelectorAll('.update-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                store.updateCartQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.qty));
            });
        });

        drawer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                store.removeFromCart(parseInt(btn.dataset.id));
            });
        });

        const checkoutBtn = drawer.querySelector('#checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                toggleDrawer();
                navigateTo('/checkout');
            });
        }
    };

    // Toggle Function
    const toggleDrawer = () => {
        const isHidden = drawer.classList.contains('translate-x-full');
        if (isHidden) {
            renderDrawer(); // Re-render logic to ensure fresh state
            drawer.classList.remove('translate-x-full');
            overlay.classList.remove('hidden', 'opacity-0');
        } else {
            drawer.classList.add('translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    };

    // Listeners
    document.addEventListener('toggle-cart', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    // Update drawer if open when cart changes
    store.subscribe('cart-updated', () => {
        if (!drawer.classList.contains('translate-x-full')) {
            renderDrawer();
        }
    });
}

// Full Cart Page (Simplified for this snippet)
export function renderCartPage(container, params) {
    const cart = store.state.cart;
    const isEmpty = cart.length === 0;

    container.innerHTML = `
        <header class="bg-white shadow sticky top-0 z-30">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href="#/" class="text-2xl font-bold text-primary-500 tracking-tight">
                    <i class="fa-solid fa-bolt"></i> ElectroPH
                </a>
                <button class="relative p-2 text-gray-600 hover:text-primary-500 transition-colors" onclick="document.dispatchEvent(new CustomEvent('toggle-cart'))">
                    <i class="fa-solid fa-cart-shopping text-xl"></i>
                    <span id="header-cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">${store.getCartCount()}</span>
                </button>
            </div>
        </header>

        <main class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>
            
            ${isEmpty ? `
                <div class="flex flex-col items-center justify-center py-20 text-gray-500">
                    <i class="fa-solid fa-cart-shopping text-6xl mb-4 text-gray-300"></i>
                    <p class="text-xl mb-4">Your cart is empty.</p>
                    <a href="#/" class="text-primary-500 font-bold hover:underline">Start Shopping</a>
                </div>
            ` : `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 space-y-4">
                        ${cart.map(item => `
                            <div class="flex gap-4 p-4 bg-white border rounded-lg shadow-sm">
                                <img src="${item.image}" class="w-24 h-24 object-cover rounded-md bg-gray-100">
                                <div class="flex-1">
                                    <h4 class="font-medium mb-1">${item.name}</h4>
                                    <p class="text-sm text-gray-500 mb-2">${store.formatCurrency(item.price)} each</p>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2 border rounded px-2 py-1 bg-gray-50">
                                            <button class="px-2 hover:text-primary-500 update-qty" data-id="${item.id}" data-qty="${item.quantity - 1}">-</button>
                                            <span>${item.quantity}</span>
                                            <button class="px-2 hover:text-primary-500 update-qty" data-id="${item.id}" data-qty="${item.quantity + 1}">+</button>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <span class="font-bold">${store.formatCurrency(item.price * item.quantity)}</span>
                                            <button class="text-gray-400 hover:text-red-500 remove-item" data-id="${item.id}">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="lg:col-span-1">
                        <div class="bg-gray-50 p-6 rounded-xl sticky top-24">
                            <h3 class="font-bold mb-4">Order Summary</h3>
                            <div class="space-y-2 text-sm mb-4">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Subtotal</span>
                                    <span>${store.formatCurrency(store.getCartTotal())}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Shipping</span>
                                    <span>${store.formatCurrency(150)}</span>
                                </div>
                                <div class="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                                    <span>Total</span>
                                    <span class="text-primary-500">${store.formatCurrency(store.getCartTotal() + 150)}</span>
                                </div>
                            </div>
                            <button id="checkout-btn-page" class="w-full bg-primary-500 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-primary-600 transition-colors">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </main>
    `;

    // Wire up event listeners
    if (!isEmpty) {
        container.querySelectorAll('.update-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                store.updateCartQuantity(parseInt(btn.dataset.id), parseInt(btn.dataset.qty));
                renderCartPage(container, params); // Re-render
            });
        });

        container.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                store.removeFromCart(parseInt(btn.dataset.id));
                renderCartPage(container, params); // Re-render
            });
        });

        const checkoutBtn = container.querySelector('#checkout-btn-page');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                navigateTo('/checkout');
            });
        }
    }

    // Update header cart count
    store.subscribe('cart-updated', (state) => {
        const badge = document.getElementById('header-cart-count');
        if (badge) badge.innerText = store.getCartCount();
    });
}
