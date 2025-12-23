/**
 * Checkout Module
 * Multi-step wizard logic
 */

import { store } from './store.js';
import { navigateTo } from './router.js';

export function renderCheckout(container) {
    if (store.state.cart.length === 0) {
        navigateTo('/');
        return;
    }

    const total = store.getCartTotal();
    const shipping = 150; // J&T Standard
    const grandTotal = total + shipping;

    const layout = `
        <header class="border-b bg-white py-4 mb-8">
            <div class="container mx-auto px-4 flex justify-between items-center">
                <div class="text-xl font-bold text-gray-800">Checkout</div>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">1</div>
                    <div class="w-12 h-1 bg-gray-200"></div>
                    <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">2</div>
                    <div class="w-12 h-1 bg-gray-200"></div>
                    <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">3</div>
                </div>
            </div>
        </header>

        <main class="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Steps Container -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- Shipping Form -->
                <form id="checkout-form" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative transition-all">
                    <h2 class="text-lg font-bold mb-4 flex items-center justify-between">
                        Shipping Information
                        <i class="fa-solid fa-check-circle text-green-500 opacity-0 transition-opacity" id="step1-check"></i>
                    </h2>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="First Name" required class="border p-2 rounded w-full focus:ring-2 focus:ring-primary-500 outline-none">
                        <input type="text" placeholder="Last Name" required class="border p-2 rounded w-full focus:ring-2 focus:ring-primary-500 outline-none">
                        <input type="tel" placeholder="Phone Number" required class="border p-2 rounded w-full col-span-2 focus:ring-2 focus:ring-primary-500 outline-none">
                        <input type="text" placeholder="Street Address" required class="border p-2 rounded w-full col-span-2 focus:ring-2 focus:ring-primary-500 outline-none">
                        <select class="border p-2 rounded w-full focus:ring-2 focus:ring-primary-500 outline-none">
                            <option>Metro Manila</option>
                            <option>Cebu</option>
                            <option>Davao</option>
                            <option>Luzon (Provinces)</option>
                            <option>Visayas</option>
                            <option>Mindanao</option>
                        </select>
                        <input type="text" placeholder="Zip Code" required class="border p-2 rounded w-full focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>
                </form>

                <!-- Payment -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 class="text-lg font-bold mb-4">Payment Method</h2>
                    <div class="space-y-3">
                        <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                            <input type="radio" name="payment" value="card" checked class="accent-primary-500">
                            <i class="fa-regular fa-credit-card text-gray-500"></i>
                            <span class="font-medium">Credit / Debit Card</span>
                        </label>
                        <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                            <input type="radio" name="payment" value="gcash" class="accent-primary-500">
                            <i class="fa-solid fa-wallet text-blue-500"></i>
                            <span class="font-medium">GCash / E-Wallet</span>
                        </label>
                        <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                            <input type="radio" name="payment" value="cod" class="accent-primary-500">
                            <i class="fa-solid fa-money-bill-wave text-green-600"></i>
                            <span class="font-medium">Cash on Delivery (J&T)</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Order Summary -->
            <div class="lg:col-span-1">
                <div class="bg-gray-50 p-6 rounded-xl sticky top-8">
                    <h3 class="font-bold mb-4">Order Summary</h3>
                    
                    <div class="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        ${store.state.cart.map(item => `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 truncate flex-1">${item.quantity}x ${item.name}</span>
                                <span class="font-medium">${store.formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="border-t pt-4 space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Subtotal</span>
                            <span>${store.formatCurrency(total)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Shipping (J&T Express)</span>
                            <span>${store.formatCurrency(shipping)}</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                            <span>Total</span>
                            <span class="text-primary-500">${store.formatCurrency(grandTotal)}</span>
                        </div>
                    </div>

                    <button id="place-order-btn" class="w-full bg-primary-500 text-white font-bold py-3 rounded-lg mt-6 shadow hover:bg-primary-600 transition-all transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Place Order
                    </button>
                    <p class="text-xs text-center text-gray-400 mt-4">Secure 256-bit SSL Encrypted</p>
                </div>
            </div>
        </main>
    `;
    container.innerHTML = layout;

    // Logic
    document.getElementById('place-order-btn').addEventListener('click', () => {
        const form = document.getElementById('checkout-form');
        if (form.checkValidity()) {
            handleSuccess(container);
        } else {
            form.reportValidity();
            // simple shake animation
            form.classList.add('animate-pulse');
            setTimeout(() => form.classList.remove('animate-pulse'), 500);
        }
    });
}

function handleSuccess(container) {
    store.clearCart();

    container.innerHTML = `
        <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 text-5xl">
                <i class="fa-solid fa-check"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p class="text-gray-500 max-w-md mb-8">Thank you for your purchase. We have sent a confirmation email to your inbox.</p>
            <p class="text-sm font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg mb-8">Order ID: #PH-${Math.floor(Math.random() * 1000000)}</p>
            
            <button onclick="window.location.hash='/'" class="bg-primary-500 text-white px-8 py-3 rounded-full font-bold shadow hover:bg-primary-600 transition-colors">
                Continue Shopping
            </button>
        </div>
        <canvas id="confetti-canvas" class="fixed inset-0 pointer-events-none z-50"></canvas>
    `;

    triggerConfetti();
}

function triggerConfetti() {
    // Simple canvas confetti implementation
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#2be75c', '#2563EB', '#facc15', '#f43f5e'];

    for (let i = 0; i < 200; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            size: Math.random() * 8 + 4,
            speed: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            p.y += p.speed;

            if (p.y > canvas.height) p.y = -10;
        });
        requestAnimationFrame(animate);
    }
    animate();
}
