"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { products } from "@/lib/data";

export default function NewArrivalsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const newProducts = products.filter((p) => p.badge === "NEW");

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 bg-gadget-surface/30">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader
            eyebrow="Fresh Drops"
            title="New Arrivals"
            subtitle="The latest tech, just landed."
          />
          <div className="hidden sm:flex items-center gap-2 pb-1">
            <button
              aria-label="Scroll left"
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full border border-gadget-border flex items-center justify-center text-gadget-muted hover:text-gadget-cyan hover:border-gadget-cyan/50 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full border border-gadget-border flex items-center justify-center text-gadget-muted hover:text-gadget-cyan hover:border-gadget-cyan/50 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        >
          {newProducts.concat(products.slice(0, 4)).map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="min-w-[260px] sm:min-w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
