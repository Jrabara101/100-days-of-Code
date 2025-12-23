/**
 * Product Detail Module
 * Renders PDP with Gallery, Info, and Reviews
 */

import { store } from './store.js';
import { navigateTo } from './router.js';

export function renderProductDetail(container, params) {
    const id = parseInt(params.get('id'));
    const product = store.state.products.find(p => p.id === id);

    if (!product) {
        container.innerHTML = '<div class="p-10 text-center">Product not found.</div>';
        return;
    }

    // Mock Related Products
    const related = store.state.products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    const layout = `
        <!-- Breadcrumbs -->
        <div class="bg-gray-50 py-4">
            <div class="container mx-auto px-4 text-sm text-gray-500">
                <a href="#/" class="hover:text-primary-500">Home</a> <span class="mx-2">/</span>
                <a href="#/" class="hover:text-primary-500">${product.category}</a> <span class="mx-2">/</span>
                <span class="text-gray-900 font-medium">${product.name}</span>
            </div>
        </div>

        <main class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                
                <!-- Gallery (Left, Col-7) -->
                <div class="lg:col-span-7">
                    <div class="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-200">
                        <img src="${product.image}" class="w-full h-full object-cover" id="main-image">
                    </div>
                    <!-- Thumbnails -->
                    <div class="grid grid-cols-5 gap-4">
                        <div class="aspect-square rounded-lg bg-gray-100 overflow-hidden border-2 border-primary-500 cursor-pointer">
                            <img src="${product.image}" class="w-full h-full object-cover">
                        </div>
                        <div class="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200 cursor-pointer opacity-70 hover:opacity-100">
                            <img src="${product.image}" class="w-full h-full object-cover" style="filter: hue-rotate(90deg)">
                        </div>
                         <div class="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200 cursor-pointer opacity-70 hover:opacity-100">
                            <img src="${product.image}" class="w-full h-full object-cover" style="filter: hue-rotate(180deg)">
                        </div>
                    </div>
                </div>

                <!-- Product Info (Right, Col-5, Sticky) -->
                <div class="lg:col-span-5">
                    <div class="sticky top-24 space-y-6">
                        <div>
                            <span class="text-primary-500 font-bold text-sm tracking-wide uppercase">${product.brand}</span>
                            <h1 class="text-3xl font-bold text-gray-900 mt-1 mb-2 leading-tight">${product.name}</h1>
                            <div class="flex items-center gap-4">
                                <div class="flex text-yellow-500 text-sm">
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star-half-stroke"></i>
                                </div>
                                <span class="text-sm text-gray-500">${product.reviews} Reviews</span>
                                <span class="text-sm text-green-600 font-medium"><i class="fa-solid fa-check-circle"></i> In Stock (${product.stock})</span>
                            </div>
                        </div>

                        <div class="border-t border-b border-gray-100 py-6">
                            <div class="flex items-end gap-3 mb-2">
                                <span class="text-4xl font-bold text-primary-500">${store.formatCurrency(product.price)}</span>
                                <span class="text-lg text-gray-400 line-through mb-1">${store.formatCurrency(product.price * 1.2)}</span>
                                <span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded mb-2">-20%</span>
                            </div>
                            <p class="text-sm text-gray-500">Inclusive of 12% VAT. Free shipping for standard delivery.</p>
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-4">
                            <div class="flex items-center border border-gray-300 rounded-lg">
                                <button class="px-4 py-2 text-gray-600 hover:bg-gray-100" id="dec-qty">-</button>
                                <input type="number" value="1" id="qty-input" class="w-12 text-center outline-none border-none font-medium" readonly>
                                <button class="px-4 py-2 text-gray-600 hover:bg-gray-100" id="inc-qty">+</button>
                            </div>
                            <button class="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all transform active:scale-95" id="pdp-add-to-cart">
                                Add to Cart
                            </button>
                            <button class="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:text-red-500 hover:border-red-500 transition-colors">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                        
                        <!-- Specs -->
                        <div class="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Processor</span>
                                <span class="font-medium">${product.specs.processor}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Memory</span>
                                <span class="font-medium">${product.specs.ram}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Storage</span>
                                <span class="font-medium">${product.specs.storage}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs Section -->
            <div class="mb-16">
                <div class="border-b border-gray-200 mb-6">
                    <nav class="flex gap-8">
                        <button class="pb-4 border-b-2 border-primary-500 font-medium text-primary-500">Description</button>
                        <button class="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">Reviews (12)</button>
                        <button class="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">Shipping</button>
                    </nav>
                </div>
                <div class="prose max-w-none text-gray-600">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                </div>
            </div>

            <!-- Related -->
            <h2 class="text-2xl font-bold mb-6">You might also like</h2>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                ${related.map(p => `
                    <div class="group cursor-pointer nav-link-related" data-id="${p.id}">
                        <div class="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                             <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                        </div>
                        <h3 class="font-medium group-hover:text-primary-500 truncate">${p.name}</h3>
                        <p class="font-bold text-gray-900">${store.formatCurrency(p.price)}</p>
                    </div>
                `).join('')}
            </div>
        </main>
    `;

    container.innerHTML = layout;

    // Logic for Qty and Add to Cart
    let currentQty = 1;
    const qtyInput = document.getElementById('qty-input');

    document.getElementById('inc-qty').addEventListener('click', () => {
        if (currentQty < product.stock) {
            currentQty++;
            qtyInput.value = currentQty;
        }
    });

    document.getElementById('dec-qty').addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            qtyInput.value = currentQty;
        }
    });

    document.getElementById('pdp-add-to-cart').addEventListener('click', () => {
        store.addToCart(product, currentQty);
        document.dispatchEvent(new CustomEvent('toggle-cart'));
    });

    // Handle Related Links
    container.querySelectorAll('.nav-link-related').forEach(el => {
        el.addEventListener('click', () => navigateTo(`/product?id=${el.dataset.id}`));
    });

    window.scrollTo(0, 0);
}
