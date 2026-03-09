/**
 * Senior Logic: Reactive Cart State
 * Uses a Proxy to listen for changes to the cart data and automatically 
 * trigger UI updates and localStorage sync.
 */
export const createReactiveCart = (initialState, updateDOMCallback) => {
    const handler = {
        set(target, property, value) {
            target[property] = value;

            // Side Effects: Whenever data changes, sync and render
            if (property === 'items') {
                target.subtotal = target.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                target.tax = target.subtotal * 0.12; // 12% Tax
                target.total = target.subtotal + target.tax + (target.shipping || 0);

                localStorage.setItem('cart_state', JSON.stringify(target.items));

                if (typeof updateDOMCallback === 'function') {
                    updateDOMCallback(target);
                }
            }
            return true;
        },
        get(target, property) {
            return target[property];
        }
    };

    return new Proxy(initialState, handler);
};
