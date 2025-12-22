import { Navigation } from "@/components/Navigation";
import { ProductCarousel } from "@/components/ProductCarousel";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Navigation />
      <ProductCarousel />
    </main>
  );
}
