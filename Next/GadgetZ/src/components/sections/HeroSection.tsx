import Link from "next/link";
import { ArrowRight, ChevronRight, Zap, Shield, Star } from "lucide-react";

const stats = [
  { value: "500K+", label: "Happy Customers" },
  { value: "12K+", label: "Products" },
  { value: "50+", label: "Top Brands" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gadget-dark">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,212,255,0.08),transparent)]" />
      <div className="absolute right-0 top-0 w-1/2 h-full bg-[radial-gradient(ellipse_60%_70%_at_80%_30%,rgba(99,102,241,0.12),transparent)]" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left: text content */}
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 self-start">
            <span className="flex h-2 w-2 rounded-full bg-gadget-cyan animate-pulse" />
            <span className="text-gadget-cyan text-xs font-montserrat font-700 tracking-[0.25em] uppercase">
              New Launch 2025
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-montserrat font-900 text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
            The Future
            <br />
            of{" "}
            <span className="text-gradient-cyan">Tech</span>
            <br />
            is Here.
          </h1>

          {/* Subheadline */}
          <p className="text-gadget-muted text-lg leading-relaxed max-w-lg">
            Discover premium gadgets curated for the modern tech enthusiast.
            From next-gen smartphones to intelligent home systems.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="#"
              className="flex items-center gap-2 bg-gadget-cyan text-gadget-dark font-montserrat font-700 text-sm px-7 py-3.5 rounded-xl hover:bg-gadget-cyan-dark glow-cyan hover:glow-cyan-lg transition-all duration-200"
            >
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 border border-gadget-border text-gadget-text font-montserrat font-600 text-sm px-7 py-3.5 rounded-xl hover:border-gadget-cyan/40 hover:bg-gadget-surface transition-all duration-200"
            >
              Explore Collections
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: Shield, text: "2-Year Warranty" },
              { icon: Zap, text: "Fast Delivery" },
              { icon: Star, text: "4.9★ Rated" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 text-gadget-muted text-xs"
              >
                <Icon className="w-3.5 h-3.5 text-gadget-cyan" />
                {text}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4 border-t border-gadget-border">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-montserrat font-900 text-2xl text-gadget-text">
                  {value}
                </p>
                <p className="text-gadget-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: hero visual */}
        <div className="relative flex items-center justify-center animate-fade-in">
          {/* Outer glow ring */}
          <div className="absolute w-96 h-96 rounded-full bg-gadget-cyan/5 border border-gadget-cyan/10 animate-glow-pulse" />
          <div className="absolute w-72 h-72 rounded-full bg-gadget-indigo/5 border border-gadget-indigo/10" />

          {/* Central card */}
          <div className="relative z-10 animate-float">
            {/* Main product display */}
            <div className="w-72 h-80 rounded-3xl border-gradient flex flex-col items-center justify-center gap-4 bg-gadget-surface/80 backdrop-blur-sm shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
              {/* Product gradient visual */}
              <div
                className="w-36 h-36 rounded-2xl flex items-center justify-center text-5xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                📱
              </div>

              <div className="text-center px-4">
                <p className="text-gadget-cyan text-xs font-montserrat font-600 tracking-widest uppercase">
                  TechCore
                </p>
                <p className="font-montserrat font-800 text-gadget-text text-lg mt-1">
                  ProPhone 15 Ultra
                </p>
                <p className="text-gadget-muted text-xs mt-1">
                  6.7&quot; AMOLED · 200MP · 5000mAh
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-gadget-text font-montserrat font-800 text-xl">
                    $1,199
                  </span>
                  <span className="text-gadget-muted text-sm line-through">
                    $1,399
                  </span>
                  <span className="text-gadget-amber text-xs font-700 font-montserrat">
                    -14%
                  </span>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-gadget-indigo text-white text-xs font-montserrat font-700 px-3 py-1.5 rounded-full shadow-lg">
              🔥 HOT
            </div>
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 bg-gadget-surface border border-gadget-border px-3 py-2 rounded-xl shadow-lg">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-gadget-surface -ml-1 first:ml-0 bg-gradient-to-br from-gadget-cyan to-gadget-indigo"
                  />
                ))}
              </div>
              <span className="text-gadget-text text-xs font-montserrat font-600">
                2.3k reviews
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gadget-muted text-xs animate-bounce">
        <span className="font-montserrat">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gadget-muted to-transparent" />
      </div>
    </section>
  );
}
