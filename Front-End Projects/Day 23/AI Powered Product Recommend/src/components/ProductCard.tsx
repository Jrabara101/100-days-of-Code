'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { Product } from '@/store';
import { gsap } from 'gsap';
import clsx from 'clsx';

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isHighConfidence = product.confidence > 0.9;
    const isSoldOut = product.stock === 0;

    useLayoutEffect(() => {
        if (isHighConfidence && !isSoldOut && cardRef.current) {
            // Neural Pulsing Glow Effect
            const ctx = gsap.context(() => {
                gsap.to(cardRef.current, {
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
                    repeat: -1,
                    yoyo: true,
                    duration: 1.5,
                    ease: 'sine.inOut',
                });

                // "Haptic" Feedback Animation (Mock)
                gsap.from(cardRef.current, {
                    scale: 0.95,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)',
                });
            }, cardRef);

            return () => ctx.revert();
        }
    }, [isHighConfidence, isSoldOut]);

    return (
        <div
            ref={cardRef}
            className={clsx(
                "relative w-[300px] h-[450px] rounded-3xl overflow-hidden flex-shrink-0 snap-center transition-all duration-500 bg-white shadow-xl",
                isSoldOut && "grayscale pointer-events-none"
            )}
        >
            {/* Sold Out Overlay */}
            {isSoldOut && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="text-white text-3xl font-bold uppercase tracking-widest border-4 border-white px-6 py-2 rotate-12">
                        Sold Out
                    </span>
                </div>
            )}

            {/* Image */}
            <div className="h-[60%] w-full overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
            </div>

            {/* Content */}
            <div className="h-[40%] p-6 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {product.category}
                        </span>
                        {isHighConfidence && (
                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                AI PICK
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                        {product.name}
                    </h3>
                    <p className="text-2xl font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                    </p>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                    <span>Confidence: {Math.round(product.confidence * 100)}%</span>
                    <span className={clsx("font-medium", product.stock < 5 ? "text-red-500" : "text-green-500")}>
                        {product.stock} left
                    </span>
                </div>
            </div>
        </div>
    );
};
