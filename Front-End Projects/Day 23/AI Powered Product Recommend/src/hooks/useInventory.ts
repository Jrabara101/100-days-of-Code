import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export const useInventory = () => {
    const { products, updateStock } = useStore();
    const productsRef = useRef(products);

    // Keep ref updated to avoid stale state in interval closure
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentProducts = productsRef.current;
            if (currentProducts.length === 0) return;

            const randomIndex = Math.floor(Math.random() * currentProducts.length);
            const product = currentProducts[randomIndex];

            if (product && product.stock > 0) {
                if (Math.random() > 0.7) { // 30% chance to decrease stock
                    const newStock = product.stock - 1;
                    console.log(`[Inventory Simulation] ${product.name} stock decreased to ${newStock}`);
                    updateStock(product.id, newStock);
                }
            }
        }, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [updateStock]);
};
