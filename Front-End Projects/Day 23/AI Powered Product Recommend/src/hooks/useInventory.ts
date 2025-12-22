import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '@/store';

const SOCKET_URL = 'http://localhost:3001';

export const useInventory = () => {
    const updateStock = useStore((state) => state.updateStock);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to inventory socket');
        });

        socket.on('inventory_update', (data: { id: string; stock: number }) => {
            console.log('Stock update received:', data);
            updateStock(data.id, data.stock);
        });

        return () => {
            socket.disconnect();
        };
    }, [updateStock]);
};
