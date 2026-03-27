import {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Home,
  Camera,
  Package,
  Volume2,
  Sparkles,
  Tag,
  type LucideProps,
} from "lucide-react";
import Link from "next/link";
import type { Category } from "@/lib/data";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Home,
  Camera,
  Package,
  Volume2,
  Sparkles,
  Tag,
};

interface CategoryCardProps {
  category: Category;
  size?: "sm" | "lg";
}

export default function CategoryCard({ category, size = "lg" }: CategoryCardProps) {
  const Icon = iconMap[category.icon] ?? Package;
  const isLg = size === "lg";

  return (
    <Link
      href={category.href}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border border-gadget-border overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,212,255,0.12)] ${
        isLg ? "p-6 gap-3" : "p-4 gap-2"
      }`}
      style={{ background: "linear-gradient(135deg, #111827 0%, #1a2336 100%)" }}
    >
      {/* Gradient orb behind icon */}
      <div
        className={`relative flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
          isLg ? "w-14 h-14" : "w-10 h-10"
        }`}
        style={{ background: category.gradient }}
      >
        <Icon
          className={`text-white ${isLg ? "w-7 h-7" : "w-5 h-5"}`}
          strokeWidth={1.5}
        />
      </div>

      <div className="text-center">
        <p
          className={`font-montserrat font-700 text-gadget-text group-hover:text-gadget-cyan transition-colors duration-200 ${
            isLg ? "text-sm" : "text-xs"
          }`}
        >
          {category.name}
        </p>
        {isLg && (
          <p className="text-gadget-muted text-[11px] mt-0.5">
            {category.count.toLocaleString()} items
          </p>
        )}
      </div>

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-gadget-cyan/30" />
    </Link>
  );
}
