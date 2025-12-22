'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useInventory } from '@/hooks/useInventory';
import { ProductCard } from './ProductCard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ProductCarousel = () => {
    const { products, setProducts } = useStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Inventory Listener
    useInventory();

    // Fetch Products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Connect to Mock ML API
                const res = await fetch('http://localhost:3001/api/recommendations');
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
            }
        };
        fetchProducts();
    }, [setProducts]);

    // GSAP Animations
    useEffect(() => {
        if (products.length === 0 || !containerRef.current) return;

        const ctx = gsap.context(() => {
            // Loop through cards and add scroll triggers
            const cards = gsap.utils.toArray<HTMLElement>('.product-card-wrapper');

            cards.forEach((card) => {
                gsap.fromTo(card,
                    {
                        scale: 0.8,
                        opacity: 0,
                        y: 50
                    },
                    {
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card,
                            scroller: containerRef.current, // Important for horizontal native scroll
                            horizontal: true,
                            start: 'left right-=100', // When left of card hits right of viewport (-100px buffer)
                            end: 'center center',
                            toggleActions: 'play none none reverse',
                        }
                    }
                );
            });

        }, containerRef);

        return () => ctx.revert();
    }, [products]);

    return (
        <section className="min-h-screen flex flex-col justify-center py-20 overflow-hidden">
            <div className="px-10 mb-8">
                <h1 className="text-6xl md:text-8xl font-bold text-gray-900 tracking-tighter leading-none mb-4">
                    Discovery <br /> Engine_
                </h1>
                <p className="text-xl text-gray-500 max-w-lg">
                    AI-curated selection based on your digital footprint.
                </p>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={containerRef}
                className="flex gap-8 overflow-x-auto px-10 py-10 pb-20 no-scrollbar snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth' }}
            >
                {products.map((product) => (
                    <div key={product.id} className="product-card-wrapper snap-center">
                        <ProductCard product={product} />
                    </div>
                ))}
                {/* Spacer for right padding */}
                <div className="w-10 flex-shrink-0" />
            </div>

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </section>
    );
};
