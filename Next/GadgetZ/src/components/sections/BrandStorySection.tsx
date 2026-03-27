import { ArrowRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "500K+", label: "Customers Served" },
  { value: "99.2%", label: "Satisfaction Rate" },
  { value: "4.9★", label: "Average Rating" },
  { value: "12+", label: "Years in Tech" },
];

const terminalLines = [
  { prompt: "$", cmd: "gadgetz --status", color: "text-gadget-cyan" },
  { prompt: "", cmd: "✓ 500K+ customers connected", color: "text-gadget-green" },
  { prompt: "", cmd: "✓ 12,000+ products indexed", color: "text-gadget-green" },
  { prompt: "", cmd: "✓ 50 premium brands loaded", color: "text-gadget-green" },
  { prompt: "$", cmd: "gadgetz --mission", color: "text-gadget-cyan" },
  { prompt: "", cmd: '"Curate. Elevate. Deliver."', color: "text-gadget-amber" },
  { prompt: "$", cmd: "gadgetz --quality check", color: "text-gadget-cyan" },
  { prompt: "", cmd: "All products verified ✓", color: "text-gadget-green" },
  { prompt: "", cmd: "Warranty covered ✓", color: "text-gadget-green" },
  { prompt: "", cmd: "2-day delivery active ✓", color: "text-gadget-green" },
  { prompt: "$", cmd: "_", color: "text-gadget-text animate-pulse" },
];

export default function BrandStorySection() {
  return (
    <section className="py-20 bg-gadget-dark">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: editorial text */}
          <div className="relative">
            {/* Cyan accent bar */}
            <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gadget-cyan via-gadget-indigo to-transparent" />

            <p className="text-gadget-cyan text-xs font-montserrat font-700 tracking-[0.25em] uppercase mb-4">
              Our Story
            </p>
            <h2 className="font-montserrat font-900 text-4xl lg:text-5xl leading-tight text-gadget-text mb-6">
              Tech, Curated
              <br />
              for{" "}
              <span className="text-gradient-cyan">Real People</span>
            </h2>
            <p className="text-gadget-muted text-base leading-relaxed mb-4">
              GadgetZ was founded on a simple belief: everyone deserves access to the best technology without the overwhelming noise of thousands of mediocre options.
            </p>
            <p className="text-gadget-muted text-base leading-relaxed mb-8">
              Every product in our catalog is hand-selected by our team of tech enthusiasts, tested for quality, and vetted by our community. We don&apos;t just sell gadgets — we curate the future of technology.
            </p>

            {/* Stats pills */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-gadget-surface border border-gadget-border rounded-2xl px-5 py-4"
                >
                  <p className="font-montserrat font-900 text-2xl text-gadget-text">
                    {value}
                  </p>
                  <p className="text-gadget-muted text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <Link
              href="#"
              className="inline-flex items-center gap-2 text-gadget-cyan font-montserrat font-700 text-sm border border-gadget-cyan/30 px-6 py-3 rounded-xl hover:bg-gadget-cyan/10 transition-all duration-200"
            >
              Our Story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right: terminal card */}
          <div className="relative">
            {/* Glow backdrop */}
            <div className="absolute inset-0 bg-gadget-cyan/3 rounded-3xl blur-3xl" />

            <div className="relative bg-gadget-surface border border-gadget-border rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {/* Terminal title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gadget-border bg-gadget-surface-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-gadget-amber/60" />
                <div className="w-3 h-3 rounded-full bg-gadget-green/60" />
                <span className="ml-2 text-gadget-muted text-xs font-montserrat">
                  gadgetz-cli v2.5.0
                </span>
              </div>

              {/* Terminal body */}
              <div className="p-6 font-mono text-sm space-y-2">
                {terminalLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {line.prompt && (
                      <span className="text-gadget-indigo shrink-0">{line.prompt}</span>
                    )}
                    <span className={line.color}>{line.cmd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
