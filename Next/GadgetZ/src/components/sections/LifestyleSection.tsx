import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import { lifestyles } from "@/lib/data";
import { ArrowRight } from "lucide-react";

export default function LifestyleSection() {
  return (
    <section className="py-20 bg-gadget-surface/20">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          eyebrow="Curated for You"
          title="Shop by Lifestyle"
          subtitle="Build your perfect tech ecosystem — by how you live and work."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {lifestyles.map((item, idx) => (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-3xl border border-gadget-border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${
                idx === 0 ? "sm:row-span-2" : ""
              }`}
              style={{ minHeight: idx === 0 ? "480px" : "220px" }}
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{ background: item.gradient }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Tags */}
              <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-montserrat font-600 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Content */}
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-montserrat font-900 text-2xl text-white leading-tight mb-1.5">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
                  {item.subtitle}
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-montserrat font-600 px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  {item.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
