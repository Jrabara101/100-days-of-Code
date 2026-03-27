import { Star, ShoppingCart, Heart } from "lucide-react";
import type { Product } from "@/lib/data";

interface ProductCardProps {
  product: Product;
}

const badgeStyles: Record<string, string> = {
  NEW: "bg-gadget-cyan/20 text-gadget-cyan border border-gadget-cyan/30",
  HOT: "bg-gadget-indigo/20 text-gadget-indigo border border-gadget-indigo/30",
  SALE: "bg-gadget-amber/20 text-gadget-amber border border-gadget-amber/30",
};

export default function ProductCard({ product }: ProductCardProps) {
  const {
    name,
    brand,
    price,
    originalPrice,
    discount,
    rating,
    reviewCount,
    badge,
    gradient,
    shortDesc,
  } = product;

  return (
    <article className="group relative flex flex-col bg-gadget-surface rounded-2xl border border-gadget-border overflow-hidden hover:-translate-y-2 hover:shadow-[0_8px_40px_rgba(0,212,255,0.15)] transition-all duration-300 cursor-pointer">
      {/* Image area */}
      <div
        className="relative h-52 w-full flex items-center justify-center overflow-hidden"
        style={{ background: gradient }}
      >
        {/* Wishlist button */}
        <button
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-gadget-cyan hover:bg-black/50 transition-colors duration-200 opacity-0 group-hover:opacity-100"
        >
          <Heart className="w-4 h-4" />
        </button>

        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-montserrat font-700 tracking-wider px-2 py-1 rounded-full ${badgeStyles[badge]}`}
          >
            {badge}
          </span>
        )}

        {/* Product visual placeholder */}
        <div className="text-center px-4">
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto flex items-center justify-center border border-white/20">
            <span className="text-white font-montserrat font-800 text-2xl opacity-60">
              {name.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-gadget-cyan text-[11px] font-montserrat font-600 tracking-widest uppercase mb-1">
          {brand}
        </p>
        <h3 className="text-gadget-text font-montserrat font-700 text-sm leading-tight mb-1 line-clamp-2">
          {name}
        </h3>
        <p className="text-gadget-muted text-xs mb-3">{shortDesc}</p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? "text-gadget-amber fill-gadget-amber"
                    : "text-gadget-border fill-gadget-border"
                }`}
              />
            ))}
          </div>
          <span className="text-gadget-muted text-[11px]">
            {rating} ({reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-montserrat font-800 text-lg text-gadget-text">
            ${price.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-gadget-muted text-sm line-through">
              ${originalPrice.toLocaleString()}
            </span>
          )}
          {discount && (
            <span className="text-gadget-amber text-[11px] font-700 font-montserrat">
              -{discount}%
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button className="mt-auto w-full flex items-center justify-center gap-2 bg-gadget-cyan/10 hover:bg-gadget-cyan text-gadget-cyan hover:text-gadget-dark border border-gadget-cyan/30 hover:border-gadget-cyan text-sm font-montserrat font-600 py-2.5 rounded-xl transition-all duration-200 group/btn">
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}
