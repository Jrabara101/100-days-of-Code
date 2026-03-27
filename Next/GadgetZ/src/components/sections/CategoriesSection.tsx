import CategoryCard from "@/components/ui/CategoryCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { categories } from "@/lib/data";

export default function CategoriesSection() {
  const topRow = categories.slice(0, 4);
  const bottomRow = categories.slice(4);

  return (
    <section className="py-20 bg-gadget-dark">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          eyebrow="Explore"
          title="Shop by Category"
          subtitle="Browse our full collection of premium gadgets, organized for easy discovery."
          ctaLabel="All Categories"
          ctaHref="#"
        />

        {/* Top row — 4 large cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {topRow.map((cat) => (
            <CategoryCard key={cat.id} category={cat} size="lg" />
          ))}
        </div>

        {/* Bottom row — 8 smaller cards (scrollable on mobile) */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {bottomRow.map((cat) => (
            <div key={cat.id} className="min-w-[100px] sm:min-w-0">
              <CategoryCard category={cat} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
