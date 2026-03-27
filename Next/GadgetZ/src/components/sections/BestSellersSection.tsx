"use client";

import { useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { products } from "@/lib/data";

const tabs = ["All", "Smartphones", "Audio", "Wearables", "Gaming"];

export default function BestSellersSection() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? products
      : products.filter((p) => p.category === activeTab);

  return (
    <section className="py-20 bg-gadget-dark">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          eyebrow="Trending"
          title="Best Sellers This Week"
          subtitle="The gadgets everyone is talking about — and buying."
          ctaLabel="View All Products"
          ctaHref="#"
        />

        {/* Tab filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-montserrat font-600 transition-all duration-200 ${
                activeTab === tab
                  ? "bg-gadget-cyan text-gadget-dark glow-cyan"
                  : "border border-gadget-border text-gadget-muted hover:text-gadget-text hover:border-gadget-border/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(filtered.length > 0 ? filtered : products).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
