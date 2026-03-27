import SectionHeader from "@/components/ui/SectionHeader";
import { brands } from "@/lib/data";

export default function FeaturedBrandsSection() {
  return (
    <section className="py-20 bg-gadget-dark overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          eyebrow="Trusted Partners"
          title="Featured Brands"
          subtitle="We carry only the most trusted names in tech."
          centered
        />
      </div>

      {/* Marquee track */}
      <div className="relative mt-4">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gadget-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gadget-dark to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-marquee">
          {[...brands, ...brands].map((brand, idx) => (
            <div
              key={`${brand.id}-${idx}`}
              className="group shrink-0 flex items-center gap-3 bg-gadget-surface border border-gadget-border rounded-2xl px-6 py-4 hover:border-opacity-50 transition-all duration-300 cursor-pointer"
              style={{
                // @ts-expect-error CSS custom property
                "--brand-color": brand.accentColor,
              }}
            >
              {/* Brand initial avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-montserrat font-800 text-lg text-white shrink-0"
                style={{ background: `${brand.accentColor}22`, border: `1px solid ${brand.accentColor}44` }}
              >
                <span style={{ color: brand.accentColor }}>{brand.initial}</span>
              </div>

              <div>
                <p
                  className="font-montserrat font-800 text-sm text-gadget-text group-hover:transition-colors"
                  style={{}}
                >
                  {brand.name}
                </p>
                <p className="text-gadget-muted text-xs mt-0.5">{brand.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Static brand grid for non-JS / accessibility */}
      <div className="max-w-screen-xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {brands.map((brand) => (
            <button
              key={brand.id}
              className="group flex flex-col items-center justify-center gap-1.5 bg-gadget-surface border border-gadget-border rounded-xl py-4 px-3 hover:border-opacity-60 transition-all duration-200"
              style={{
                // @ts-expect-error CSS custom property
                "--tw-ring-color": brand.accentColor,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-montserrat font-800 text-base"
                style={{
                  background: `${brand.accentColor}22`,
                  border: `1px solid ${brand.accentColor}44`,
                  color: brand.accentColor,
                }}
              >
                {brand.initial}
              </div>
              <span className="text-gadget-muted text-[11px] font-montserrat font-600 group-hover:text-gadget-text transition-colors duration-200">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
