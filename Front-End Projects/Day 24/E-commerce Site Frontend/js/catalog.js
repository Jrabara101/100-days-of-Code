/**
 * Catalog Module
 * Renders Hero, Filters, and Product Grid
 */

import { store } from './store.js';
import { navigateTo } from './router.js';

let observer;
let renderedCount = 0;
const BATCH_SIZE = 12;

export function renderCatalog(container, params) {
    const layout = `
        <!-- Header -->
        <header class="bg-white shadow sticky top-0 z-30">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href="#/" class="text-2xl font-bold text-primary-500 tracking-tight">
                    <i class="fa-solid fa-bolt"></i> ElectroPH
                </a>
                
                <div class="hidden md:flex flex-1 max-w-lg mx-8 relative">
                    <input type="text" placeholder="Search products..." class="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                    <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>

                <div class="flex items-center gap-4">
                    <button class="relative p-2 text-gray-600 hover:text-primary-500 transition-colors" onclick="document.dispatchEvent(new CustomEvent('toggle-cart'))">
                        <i class="fa-solid fa-cart-shopping text-xl"></i>
                        <span id="header-cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">${store.getCartCount()}</span>
                    </button>
                    <!-- Mobile Menu Btn -->
                    <button class="md:hidden text-gray-600"><i class="fa-solid fa-bars text-xl"></i></button>
                </div>
            </div>
        </header>

        <!-- Hero Carousel -->
        <section class="relative bg-gray-900 text-white h-[400px] overflow-hidden group">
            <div id="hero-slides" class="h-full w-full relative">
                <!-- Slides injected here -->
            </div>
            
            <!-- Controls -->
            <button id="prev-slide" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur rounded-full p-3 text-white transition-all opacity-0 group-hover:opacity-100">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button id="next-slide" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur rounded-full p-3 text-white transition-all opacity-0 group-hover:opacity-100">
                <i class="fa-solid fa-chevron-right"></i>
            </button>

            <!-- Indicators -->
            <div id="hero-dots" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"></div>
        </section>

        <!-- Main Content -->
        <main class="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
            
            <!-- Sidebar Filters -->
            <aside class="w-full md:w-64 flex-shrink-0 space-y-8 sticky top-24 h-fit hidden md:block">
                <div>
                    <h3 class="font-bold text-gray-900 mb-4">Categories</h3>
                    <ul class="space-y-2 text-gray-600 cursor-pointer">
                        <li class="hover:text-primary-500 font-medium text-primary-500">All Electronics</li>
                        <li class="hover:text-primary-500">Laptops & Computers</li>
                        <li class="hover:text-primary-500">Smartphones</li>
                        <li class="hover:text-primary-500">Audio & Headphones</li>
                        <li class="hover:text-primary-500">Cameras</li>
                    </ul>
                </div>

                <div>
                    <h3 class="font-bold text-gray-900 mb-4">Price Range</h3>
                    <input type="range" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500">
                    <div class="flex justify-between text-sm text-gray-500 mt-2">
                        <span>₱500</span>
                        <span>₱100K+</span>
                    </div>
                </div>

                <div>
                    <h3 class="font-bold text-gray-900 mb-4">Brands</h3>
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-gray-600"><input type="checkbox" class="rounded text-primary-500"> Apple</label>
                        <label class="flex items-center gap-2 text-gray-600"><input type="checkbox" class="rounded text-primary-500"> Samsung</label>
                        <label class="flex items-center gap-2 text-gray-600"><input type="checkbox" class="rounded text-primary-500"> Sony</label>
                    </div>
                </div>
            </aside>

            <!-- Product Grid Area -->
            <div class="flex-1">
                <!-- Sorting Bar -->
                <div class="flex justify-between items-center mb-6">
                    <p class="text-gray-500"><span class="font-bold text-gray-900">${store.state.products.length}</span> Products Found</p>
                    <select class="border-gray-300 rounded-lg text-sm p-2 bg-white shadow-sm outline-none focus:ring-1 focus:ring-primary-500">
                        <option>Sort by: Featured</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Newest Arrivals</option>
                    </select>
                </div>

                <!-- Grid -->
                <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Products injected here -->
                </div>

                <!-- Loading Skeleton / Observer Target -->
                <div id="sentinel" class="h-20 mt-8 flex items-center justify-center">
                    <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </main>
    `;

    container.innerHTML = layout;

    // Reset rendering
    renderedCount = 0;
    renderBatch();

    // Setup Observer for Infinite Scroll
    const sentinel = document.getElementById('sentinel');
    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setTimeout(() => {
                renderBatch(); // Simulate network delay
            }, 500);
        }
    }, { rootMargin: '100px' });

    observer.observe(sentinel);

    // Header Cart Count Update
    store.subscribe('cart-updated', (state) => {
        const badge = document.getElementById('header-cart-count');
        if (badge) badge.innerText = store.getCartCount();
    });
}

function renderBatch() {
    const grid = document.getElementById('product-grid');
    const products = store.state.products;

    // Stop if all rendered
    if (renderedCount >= products.length) {
        document.getElementById('sentinel').style.display = 'none';
        return;
    }

    const nextBatch = products.slice(renderedCount, renderedCount + BATCH_SIZE);

    nextBatch.forEach(product => {
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col";
        card.innerHTML = `
            <div class="relative aspect-square overflow-hidden bg-gray-100">
                <img src="${product.image}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                
                ${product.isNew ? '<span class="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>' : ''}
                
                <!-- Hover Actions -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 translate-y-4 group-hover:translate-y-0 duration-300">
                    <button class="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors nav-link" data-id="${product.id}" title="View Details">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                    <button class="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors add-to-cart-btn" data-id="${product.id}" title="Add to Cart">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-4 flex flex-col flex-1">
                <p class="text-xs text-gray-500 mb-1">${product.category}</p>
                <h3 class="font-bold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-primary-500 nav-link" data-id="${product.id}">${product.name}</h3>
                <div class="flex items-center gap-1 text-xs text-yellow-400 mb-3">
                    <i class="fa-solid fa-star"></i>
                    <span class="text-gray-500">(${product.rating})</span>
                </div>
                
                <div class="mt-auto flex items-center justify-between">
                    <span class="text-lg font-bold text-primary-500">${store.formatCurrency(product.price)}</span>
                </div>
            </div>
        `;

        // Event Listeners for buttons
        const navLinks = card.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent bubbling if needed
                navigateTo(`/product?id=${product.id}`);
            });
        });

        const addBtn = card.querySelector('.add-to-cart-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            store.addToCart(product);
            document.dispatchEvent(new CustomEvent('toggle-cart')); // Open cart on add
        });

        grid.appendChild(card);
    });

    renderedCount += BATCH_SIZE;
}

// Hero Slider Logic
function initHeroSlider() {
    const slides = [
        {
            title: "iPhone 16 Pro Max<br>Titanium Finish",
            subtitle: "Experience the power of the A18 Bionic chip.",
            tag: "NEW ARRIVAL",
            image: "https://placehold.co/1920x600/111827/2563EB?text=iPhone+16+Pro",
            color: "bg-primary-500"
        },
        {
            title: "MacBook Air M3<br>Strikingly Thin",
            subtitle: "Supercharged by M3. Work and play like never before.",
            tag: "BEST SELLER",
            image: "https://placehold.co/1920x600/222/22c55e?text=Macbook+Air+M3",
            color: "bg-green-500"
        },
        {
            title: "Sony WH-1000XM5<br>Noise Canceling",
            subtitle: "Distraction-free listening. Pure sound.",
            tag: "AUDIOPHILE",
            image: "https://placehold.co/1920x600/333/f59e0b?text=Sony+Headphones",
            color: "bg-yellow-500"
        }
    ];

    const container = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('hero-dots');
    if (!container) return;

    let currentSlide = 0;

    // Render Slides
    container.innerHTML = slides.map((slide, index) => `
        <div class="absolute inset-0 transition-opacity duration-700 ease-in-out ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'} slide-item" data-index="${index}">
             <img src="${slide.image}" class="absolute inset-0 w-full h-full object-cover opacity-60">
             <div class="container mx-auto h-full flex items-center relative z-20 px-4">
                <div class="max-w-xl animate-slide-in">
                    <span class="${slide.color} text-xs font-bold px-2 py-1 rounded mb-2 inline-block shadow-sm">${slide.tag}</span>
                    <h1 class="text-5xl font-bold mb-4 leading-tight shadow-black drop-shadow-lg">${slide.title}</h1>
                    <p class="text-gray-100 mb-8 text-lg drop-shadow-md">${slide.subtitle}</p>
                    <button class="${slide.color} hover:brightness-110 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">Shop Now</button>
                </div>
            </div>
        </div>
    `).join('');

    // Render Dots
    dotsContainer.innerHTML = slides.map((_, index) => `
        <button class="w-3 h-3 rounded-full transition-all ${index === 0 ? 'bg-white w-8' : 'bg-white/50 hover:bg-white'} dot-btn" data-index="${index}"></button>
    `).join('');

    const updateSlide = (newIndex) => {
        const items = container.querySelectorAll('.slide-item');
        const dots = dotsContainer.querySelectorAll('.dot-btn');

        items[currentSlide].classList.remove('opacity-100', 'z-10');
        items[currentSlide].classList.add('opacity-0', 'z-0');

        dots[currentSlide].classList.remove('bg-white', 'w-8');
        dots[currentSlide].classList.add('bg-white/50');

        currentSlide = (newIndex + slides.length) % slides.length;

        items[currentSlide].classList.add('opacity-100', 'z-10');
        items[currentSlide].classList.remove('opacity-0', 'z-0');

        dots[currentSlide].classList.add('bg-white', 'w-8');
        dots[currentSlide].classList.remove('bg-white/50');
    };

    // Events
    document.getElementById('next-slide').addEventListener('click', () => updateSlide(currentSlide + 1));
    document.getElementById('prev-slide').addEventListener('click', () => updateSlide(currentSlide - 1));

    // Auto Play
    setInterval(() => updateSlide(currentSlide + 1), 5000);
}

// Call initSlider after render
const originalRenderCatalog = renderCatalog;
renderCatalog = function (container, params) {
    originalRenderCatalog(container, params);
    initHeroSlider();
};
