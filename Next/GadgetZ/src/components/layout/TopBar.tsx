import { Truck, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function TopBar() {
  return (
    <div className="bg-gadget-surface border-b border-gadget-border text-xs">
      <div className="max-w-screen-xl mx-auto px-4 h-9 flex items-center justify-between gap-4">
        {/* Left: shipping info */}
        <div className="hidden sm:flex items-center gap-1.5 text-gadget-muted shrink-0">
          <Truck className="w-3.5 h-3.5 text-gadget-cyan" />
          <span>Free shipping on orders over <strong className="text-gadget-text">$50</strong></span>
        </div>

        {/* Center: scrolling promo */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[
              "🔥 New arrivals every week — shop the latest",
              "⚡ Up to 30% off on Gaming Gear",
              "🎧 Premium Audio — Feel every beat",
              "📱 Trade-in your old device and save big",
              "🔥 New arrivals every week — shop the latest",
              "⚡ Up to 30% off on Gaming Gear",
              "🎧 Premium Audio — Feel every beat",
              "📱 Trade-in your old device and save big",
            ].map((text, i) => (
              <span key={i} className="text-gadget-muted">
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* Right: currency + sign in */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <button className="flex items-center gap-1 text-gadget-muted hover:text-gadget-text transition-colors duration-200">
            USD <ChevronDown className="w-3 h-3" />
          </button>
          <span className="text-gadget-border">|</span>
          <Link
            href="#"
            className="text-gadget-muted hover:text-gadget-cyan transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
