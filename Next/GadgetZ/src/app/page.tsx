import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import NewArrivalsSection from "@/components/sections/NewArrivalsSection";
import FeaturedBrandsSection from "@/components/sections/FeaturedBrandsSection";
import PromoBannerSection from "@/components/sections/PromoBannerSection";
import BestSellersSection from "@/components/sections/BestSellersSection";
import LifestyleSection from "@/components/sections/LifestyleSection";
import BrandStorySection from "@/components/sections/BrandStorySection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import SocialProofSection from "@/components/sections/SocialProofSection";

export default function Home() {
  return (
    <>
      <TopBar />
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <NewArrivalsSection />
        <FeaturedBrandsSection />
        <PromoBannerSection />
        <BestSellersSection />
        <LifestyleSection />
        <BrandStorySection />
        <NewsletterSection />
        <SocialProofSection />
      </main>
      <Footer />
    </>
  );
}
