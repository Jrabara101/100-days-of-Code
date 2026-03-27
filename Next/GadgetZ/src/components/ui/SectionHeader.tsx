import Link from "next/link";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  centered?: boolean;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  ctaHref = "#",
  centered = false,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-2 mb-10 ${
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={centered ? "max-w-2xl" : ""}>
        {eyebrow && (
          <p className="text-gadget-cyan text-xs font-montserrat font-700 tracking-[0.2em] uppercase mb-2">
            {eyebrow}
          </p>
        )}
        <h2 className="font-montserrat font-800 text-2xl sm:text-3xl lg:text-4xl text-gadget-text leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gadget-muted mt-2 text-sm sm:text-base max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {ctaLabel && !centered && (
        <Link
          href={ctaHref}
          className="shrink-0 text-gadget-cyan text-sm font-600 font-montserrat tracking-wide border border-gadget-cyan/30 px-4 py-2 rounded-full hover:bg-gadget-cyan/10 transition-colors duration-200 mt-4 sm:mt-0"
        >
          {ctaLabel} →
        </Link>
      )}
      {ctaLabel && centered && (
        <Link
          href={ctaHref}
          className="mt-4 inline-block text-gadget-cyan text-sm font-600 font-montserrat tracking-wide border border-gadget-cyan/30 px-6 py-2.5 rounded-full hover:bg-gadget-cyan/10 transition-colors duration-200"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
