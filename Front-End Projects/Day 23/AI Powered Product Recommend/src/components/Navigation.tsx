'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const Navigation = () => {
    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 glass rounded-full px-8 py-4 flex justify-between items-center shadow-lg"
        >
            <div className="text-xl font-bold tracking-tight">
                Lumina<span className="text-blue-500">.ai</span>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
                <a href="#" className="hover:text-black transition-colors">Discover</a>
                <a href="#" className="hover:text-black transition-colors">Curated</a>
                <a href="#" className="hover:text-black transition-colors">Journal</a>
            </div>
            <div className="flex gap-4">
                {/* Mock Search Icon */}
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
        </motion.nav>
    );
};
