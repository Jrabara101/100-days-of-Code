import { create } from 'zustand';

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    confidence: number;
    stock: number;
}

interface StoreState {
    products: Product[];
    setProducts: (products: Product[]) => void;
    updateStock: (productId: string, newStock: number) => void;
}

export const useStore = create<StoreState>((set) => ({
    products: [],
    setProducts: (products) => set({ products }),
    updateStock: (productId, newStock) =>
        set((state) => ({
            products: state.products.map((p) =>
                p.id === productId ? { ...p, stock: newStock } : p
            ),
        })),
}));
