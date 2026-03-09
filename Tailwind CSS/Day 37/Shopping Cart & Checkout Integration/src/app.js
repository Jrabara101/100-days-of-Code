import { products } from './products.js';
import { createReactiveCart } from './state.js';

// --- State Initialization ---
const savedCart = JSON.parse(localStorage.getItem('cart_state')) || [];
const initialState = {
    items: savedCart,
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0
};

// Undo State
let lastRemovedItem = null;
let undoTimeout = null;

// --- DOM Elements ---
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const cartFooter = document.getElementById('cart-footer');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const undoSnackbar = document.getElementById('undo-snackbar');
const undoBtn = document.getElementById('undo-btn');

// --- Cart Logic & Proxy Sync ---
const updateCartDOM = (state) => {
    const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
    cartCount.classList.toggle('hidden', count === 0);

    if (state.items.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(emptyCartMsg);
        emptyCartMsg.classList.remove('hidden');
        cartFooter.classList.add('hidden');
    } else {
        emptyCartMsg.classList.add('hidden');
        cartFooter.classList.remove('hidden');

        cartItemsContainer.innerHTML = state.items.map((item, index) => `
            <div class="cart-item glass-light rounded-2xl p-4 flex gap-4 staggered-item show" style="animation-delay: ${index * 0.1}s">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-xl border border-white/5">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold">${item.name}</h4>
                        <button class="remove-item text-slate-500 hover:text-red-400 transition-colors" data-id="${item.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-xs text-slate-500 mb-2">$${item.price.toFixed(2)}</p>
                    <div class="flex items-center gap-3">
                        <button class="qty-btn bg-white/5 hover:bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="tabular-nums font-bold">${item.quantity}</span>
                        <button class="qty-btn bg-white/5 hover:bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('cart-subtotal').textContent = `$${state.subtotal.toFixed(2)}`;
        document.getElementById('cart-tax').textContent = `$${state.tax.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${state.total.toFixed(2)}`;
    }

    updateProductButtons(state.items);
};

const cart = createReactiveCart(initialState, updateCartDOM);
updateCartDOM(cart);

const renderProducts = () => {
    productGrid.innerHTML = products.map(product => `
        <div class="group glass rounded-[2.5rem] p-6 hover:border-purple-500/30 transition-all duration-500" data-id="${product.id}">
            <div class="relative aspect-square mb-6 overflow-hidden rounded-3xl bg-slate-900/50">
                <img src="${product.image}" alt="${product.name}" class="product-img w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold">${product.name}</h3>
                        <p class="text-xs text-slate-500 uppercase tracking-widest mt-1">Premium Core</p>
                    </div>
                    <span class="text-xl font-bold text-gradient tabular-nums">$${product.price.toFixed(2)}</span>
                </div>
                <p class="text-sm text-slate-400 line-clamp-2">${product.description}</p>
                <div class="pt-2">
                    <div class="btn-container flex justify-end" id="btn-container-${product.id}">
                        <button class="add-to-cart w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-purple-500 group-hover:text-white" data-id="${product.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

const updateProductButtons = (items) => {
    products.forEach(product => {
        const itemInCart = items.find(i => i.id === product.id);
        const container = document.getElementById(`btn-container-${product.id}`);
        if (!container) return;

        if (itemInCart) {
            container.innerHTML = `
                <div class="pill-selector glass-light rounded-full p-1 flex items-center gap-4 animate-fadeIn border border-white/10">
                    <button class="qty-btn bg-white/5 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold" data-id="${product.id}" data-action="decrease">-</button>
                    <span class="tabular-nums font-bold w-4 text-center">${itemInCart.quantity}</span>
                    <button class="qty-btn bg-white/5 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold" data-id="${product.id}" data-action="increase">+</button>
                </div>
            `;
        } else {
            if (container.querySelector('.pill-selector')) {
                container.innerHTML = `
                    <button class="add-to-cart w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-purple-500 group-hover:text-white" data-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add to Cart
                    </button>
                `;
            }
        }
    });
};

renderProducts();

const animateToCart = (startEl) => {
    const rect = startEl.getBoundingClientRect();
    const target = cartToggle.getBoundingClientRect();
    const clone = startEl.cloneNode(true);
    clone.classList.add('flying-product');
    clone.style.width = '60px';
    clone.style.height = '60px';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    const dx = (target.left + target.width / 2) - (rect.left + rect.width / 2);
    const dy = (target.top + target.height / 2) - (rect.top + rect.height / 2);
    clone.style.setProperty('--target-x', `${dx}px`);
    clone.style.setProperty('--target-y', `${dy}px`);
    document.body.appendChild(clone);
    clone.addEventListener('animationend', () => clone.remove());
};

document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart');
    const qtyBtn = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.remove-item');

    if (addBtn) {
        const id = parseInt(addBtn.dataset.id);
        const product = products.find(p => p.id === id);
        const productCard = e.target.closest('[data-id]');
        const productImg = productCard.querySelector('.product-img');
        animateToCart(productImg);
        cart.items = [...cart.items, { ...product, quantity: 1 }];
    }

    if (qtyBtn) {
        const id = parseInt(qtyBtn.dataset.id);
        const action = qtyBtn.dataset.action;
        const newItems = cart.items.map(item => {
            if (item.id === id) {
                const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                return { ...item, quantity: Math.max(0, newQty) };
            }
            return item;
        }).filter(item => item.quantity > 0);
        cart.items = newItems;
    }

    if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id);
        lastRemovedItem = cart.items.find(i => i.id === id);
        cart.items = cart.items.filter(item => item.id !== id);
        showUndo();
    }
});

const showUndo = () => {
    undoSnackbar.classList.remove('translate-y-[150%]');
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        undoSnackbar.classList.add('translate-y-[150%]');
    }, 4000);
};

undoBtn.addEventListener('click', () => {
    if (lastRemovedItem) {
        cart.items = [...cart.items, lastRemovedItem];
        lastRemovedItem = null;
        undoSnackbar.classList.add('translate-y-[150%]');
    }
});

cartToggle.addEventListener('click', () => {
    cartDrawer.classList.remove('translate-x-full');
    cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
});

const closeCart = () => {
    cartDrawer.classList.add('translate-x-full');
    cartOverlay.classList.add('opacity-0', 'pointer-events-none');
};

cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.getElementById('start-shopping')?.addEventListener('click', closeCart);

const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const backToCart = document.getElementById('back-to-cart');

checkoutBtn.addEventListener('click', () => {
    checkoutModal.classList.remove('hidden');
    updateCheckoutTotals();
});

backToCart.addEventListener('click', () => {
    checkoutModal.classList.add('hidden');
});

const updateCheckoutTotals = () => {
    document.getElementById('final-count').textContent = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('final-total').textContent = `$${cart.total.toFixed(2)}`;
};

const steps = [
    { trigger: 'step1-trigger', content: 'step1-content' },
    { trigger: 'step2-trigger', content: 'step2-content' },
    { trigger: 'step3-trigger', content: 'step3-content' }
];

const toggleStep = (stepIdx) => {
    steps.forEach((step, idx) => {
        const content = document.getElementById(step.content);
        const trigger = document.getElementById(step.trigger);
        if (idx === stepIdx) {
            content.classList.add('open');
            trigger.classList.remove('opacity-50', 'cursor-not-allowed');
            trigger.disabled = false;
        } else {
            content.classList.remove('open');
        }
    });
};

document.getElementById('shipping-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('full-name').value;
    document.getElementById('shipping-summary').classList.remove('hidden');
    document.querySelector('#shipping-summary .summary-text').textContent = name;
    toggleStep(1);
});

const cardNumberInput = document.getElementById('card-number');
const cardIcon = document.getElementById('card-type-icon');

cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    e.target.value = formatted;

    if (value.startsWith('4')) {
        cardIcon.innerHTML = '<span class="text-blue-400 font-bold">VISA</span>';
    } else if (value.startsWith('5')) {
        cardIcon.innerHTML = '<span class="text-orange-400 font-bold">MC</span>';
    } else if (value.startsWith('34') || value.startsWith('37')) {
        cardIcon.innerHTML = '<span class="text-green-400 font-bold">AMEX</span>';
    } else {
        cardIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>';
    }
});

document.getElementById('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const num = cardNumberInput.value;
    document.getElementById('payment-summary').classList.remove('hidden');
    document.querySelector('#payment-summary .summary-text').textContent = `**** ${num.slice(-4)}`;
    toggleStep(2);
});

const placeOrderBtn = document.getElementById('place-order-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const receiptOverlay = document.getElementById('receipt-overlay');

placeOrderBtn.addEventListener('click', () => {
    placeOrderBtn.disabled = true;
    placeOrderBtn.classList.add('opacity-70');
    loadingSpinner.classList.remove('hidden');
    setTimeout(() => {
        showReceipt();
    }, 2000);
});

const showReceipt = () => {
    const container = document.getElementById('receipt-items');
    container.innerHTML = cart.items.map(item => `
        <div class="flex justify-between">
            <span>${item.name} x${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    document.getElementById('receipt-total').textContent = `$${cart.total.toFixed(2)}`;
    receiptOverlay.classList.remove('hidden');
    receiptOverlay.classList.add('flex');
    cart.items = [];
    localStorage.removeItem('cart_state');
};

document.getElementById('close-receipt').addEventListener('click', () => {
    location.reload();
});
