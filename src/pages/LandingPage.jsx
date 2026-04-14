import { Suspense, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useSeo } from "../hooks/useSeo";
import AboutSection from "../landing/sections/AboutSection";
import ContactSection from "../landing/sections/ContactSection";
import FeaturedPropertiesSection from "../landing/sections/FeaturedPropertiesSection";
import HeroSection from "../landing/sections/HeroSection";
import ServicesSection from "../landing/sections/ServicesSection";
import StatsSection from "../landing/sections/StatsSection";
import { lazyWithRetry } from "../utils/lazyRetry";
import { DEFAULT_META_DESCRIPTION } from "../utils/seo";

const PropertyDetailModal = lazyWithRetry(() => import("../components/PropertyDetailModal"));

export default function LandingPage() {
  useSeo({ canonicalPath: "/", description: DEFAULT_META_DESCRIPTION });

  const [selectedListingId, setSelectedListingId] = useState(null);

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <ServicesSection />
        <FeaturedPropertiesSection onSelectListing={setSelectedListingId} />
        <ContactSection />
      </main>
      <Footer />
      {selectedListingId != null && (
        <Suspense fallback={null}>
          <PropertyDetailModal
            listingId={selectedListingId}
            onClose={() => setSelectedListingId(null)}
          />
        </Suspense>
      )}
    </>
  );
}
