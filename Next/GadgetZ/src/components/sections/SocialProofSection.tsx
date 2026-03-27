import SectionHeader from "@/components/ui/SectionHeader";
import { testimonials } from "@/lib/data";
import { Star, BadgeCheck } from "lucide-react";

export default function SocialProofSection() {
  return (
    <section className="py-20 bg-gadget-dark">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          eyebrow="What They Say"
          title="Trusted by Tech Lovers"
          subtitle="Real reviews from real customers who live and breathe tech."
          centered
        />

        {/* Rating summary */}
        <div className="flex flex-wrap justify-center gap-8 mb-14">
          {[
            { value: "4.9", label: "Overall Rating" },
            { value: "500K+", label: "Happy Customers" },
            { value: "98%", label: "Would Recommend" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-montserrat font-900 text-4xl text-gadget-text">{value}</p>
              <p className="text-gadget-muted text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className="group bg-gadget-surface border border-gadget-border rounded-2xl p-6 hover:border-gadget-cyan/20 hover:shadow-[0_4px_20px_rgba(0,212,255,0.06)] transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < t.rating
                        ? "text-gadget-amber fill-gadget-amber"
                        : "text-gadget-border fill-gadget-border"
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <p className="text-gadget-muted text-sm leading-relaxed mb-5 line-clamp-4">
                &ldquo;{t.review}&rdquo;
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-montserrat font-700 text-sm shrink-0"
                  style={{ background: t.avatarGradient }}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-montserrat font-700 text-gadget-text text-sm truncate">
                      {t.name}
                    </p>
                    {t.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-gadget-cyan shrink-0" />
                    )}
                  </div>
                  <p className="text-gadget-muted text-xs">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
