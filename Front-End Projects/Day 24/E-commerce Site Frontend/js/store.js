/**
 * Store Module
 * Handles centralized state: Products, Cart, User
 */

export const store = {
    state: {
        products: [],
        cart: [],
        user: { name: 'Guest' },
        filters: {
            category: 'all',
            minPrice: 0,
            maxPrice: 100000,
            search: '',
            sort: 'newest'
        }
    },

    // Initialize Store
    init() {
        this.loadCart();
        this.generateProducts(200);
        console.log(`[Store] Initialized with ${this.state.products.length} products.`);
    },

    // Mock Data Generator
    generateProducts(count) {
        const categories = ['Laptops', 'Smartphones', 'Headphones', 'Cameras', 'Accessories'];
        const brands = ['Apple', 'Samsung', 'Sony', 'Dell', 'Asus', 'Logitech'];

        for (let i = 1; i <= count; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const price = this.randomPrice(category);

            this.state.products.push({
                id: i,
                name: `${brand} ${category} ${this.generateModelName()}`,
                brand: brand,
                category: category,
                price: price,
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
                reviews: Math.floor(Math.random() * 500),
                stock: Math.floor(Math.random() * 50),
                image: `https://placehold.co/400x400/e2e8f0/1e293b?text=${category}+${i}`,
                isNew: Math.random() > 0.8,
                specs: {
                    processor: 'Octa-Core',
                    ram: '8GB',
                    storage: '256GB'
                }
            });
        }
    },

    randomPrice(category) {
        let min = 1000, max = 5000;
        if (category === 'Laptops') { min = 25000; max = 95000; }
        if (category === 'Smartphones') { min = 8000; max = 60000; }
        if (category === 'Headphones') { min = 1500; max = 15000; }
        if (category === 'Cameras') { min = 15000; max = 80000; }

        return Math.floor(Math.random() * (max - min) + min);
    },

    generateModelName() {
        const suffixes = ['Pro', 'Max', 'Ultra', 'Lite', 'X', 'Elite', 'Plus'];
        const num = Math.floor(Math.random() * 1000);
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `Model-${num} ${suffix}`;
    },

    // --- Cart Actions ---

    addToCart(product, quantity = 1) {
        const existingItem = this.state.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.state.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.notifyListeners('cart-updated');
        this.showToast(`Added ${product.name} to cart!`);
    },

    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.notifyListeners('cart-updated');
    },

    updateCartQuantity(productId, quantity) {
        const item = this.state.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.notifyListeners('cart-updated');
            }
        }
    },

    clearCart() {
        this.state.cart = [];
        this.saveCart();
        this.notifyListeners('cart-updated');
    },

    getCartTotal() {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCartCount() {
        return this.state.cart.reduce((total, item) => total + item.quantity, 0);
    },

    // --- Persistence ---
    saveCart() {
        localStorage.setItem('electro_cart', JSON.stringify(this.state.cart));
    },

    loadCart() {
        const saved = localStorage.getItem('electro_cart');
        if (saved) {
            this.state.cart = JSON.parse(saved);
        }
    },

    // --- Event System (Simple Pub/Sub) ---
    listeners: {},

    subscribe(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },

    notifyListeners(event, data = null) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(this.state, data));
        }
    },

    // --- Utils ---
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `p-4 rounded shadow-lg text-white font-medium animate-slide-in ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        toast.innerText = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};
