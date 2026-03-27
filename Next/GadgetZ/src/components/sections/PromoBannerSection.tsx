import Link from "next/link";
import { ArrowRight, Zap, Check } from "lucide-react";

const features = [
  "Active Noise Cancellation",
  "40-hour battery life",
  "Hi-Res Audio certified",
  "Spatial Audio support",
  "2-year warranty",
];

export default function PromoBannerSection() {
  return (
    <section className="py-20 bg-gadget-surface/20">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden border border-gadget-border">
          {/* Background split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px]">
            {/* Left — gradient campaign */}
            <div
              className="relative flex flex-col justify-center gap-6 p-10 lg:p-14"
              style={{
                background: "linear-gradient(135deg, #0d1b4b 0%, #1a0533 50%, #0c2340 100%)",
              }}
            >
              {/* BG orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gadget-indigo/10 blur-3xl" />
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gadget-cyan/8 blur-3xl" />

              {/* Content */}
              <div className="relative z-10">
                {/* Launch badge */}
                <div className="inline-flex items-center gap-2 bg-gadget-amber/10 border border-gadget-amber/30 text-gadget-amber text-xs font-montserrat font-700 tracking-wider px-3 py-1.5 rounded-full mb-4">
                  <Zap className="w-3 h-3" />
                  Just Launched · Limited Stock
                </div>

                <h2 className="font-montserrat font-900 text-4xl lg:text-5xl leading-tight text-white mb-4">
                  Experience
                  <br />
                  <span className="text-gradient-cyan">Next-Gen</span>
                  <br />
                  Audio
                </h2>

                <p className="text-gadget-muted text-base leading-relaxed max-w-sm mb-6">
                  SoundSphere Pro — redefining what headphones can do. Pure studio sound, anywhere you go.
                </p>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-montserrat font-900 text-3xl text-white">
                        $349
                      </span>
                      <span className="text-gadget-muted line-through text-base">
                        $449
                      </span>
                      <span className="text-gadget-amber font-montserrat font-700 text-sm">
                        -22%
                      </span>
                    </div>
                    <p className="text-gadget-muted text-xs mt-0.5">
                      Free shipping · 30-day returns
                    </p>
                  </div>
                </div>

                <Link
                  href="#"
                  className="inline-flex items-center gap-2 mt-6 bg-gadget-cyan text-gadget-dark font-montserrat font-700 text-sm px-6 py-3 rounded-xl hover:bg-gadget-cyan-dark transition-colors duration-200 glow-cyan"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right — product specs */}
            <div className="relative flex flex-col justify-center gap-6 p-10 lg:p-14 bg-gadget-surface">
              <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-gadget-cyan/30 to-transparent" />

              {/* Product visual */}
              <div className="flex items-center gap-6 mb-2">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-lg shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  }}
                >
                  🎧
                </div>
                <div>
                  <p className="text-gadget-cyan text-xs font-montserrat font-700 tracking-widest uppercase">
                    AudioMax
                  </p>
                  <p className="font-montserrat font-800 text-gadget-text text-xl mt-0.5">
                    SoundSphere Pro
                  </p>
                  <p className="text-gadget-muted text-sm mt-0.5">
                    Over-Ear Wireless Headphones
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="font-montserrat font-700 text-gadget-text text-sm mb-4 tracking-wide">
                  Key Features
                </p>
                <ul className="flex flex-col gap-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-gadget-cyan/10 border border-gadget-cyan/30 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-gadget-cyan" />
                      </span>
                      <span className="text-gadget-muted text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rating strip */}
              <div className="flex items-center gap-6 pt-4 border-t border-gadget-border">
                <div className="text-center">
                  <p className="font-montserrat font-900 text-2xl text-gadget-text">4.7</p>
                  <p className="text-gadget-muted text-xs">Rating</p>
                </div>
                <div className="text-center">
                  <p className="font-montserrat font-900 text-2xl text-gadget-text">4.5K</p>
                  <p className="text-gadget-muted text-xs">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="font-montserrat font-900 text-2xl text-gadget-cyan">#1</p>
                  <p className="text-gadget-muted text-xs">Best Seller</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
