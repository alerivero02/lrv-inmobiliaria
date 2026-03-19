import { Suspense, lazy, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSection from "../landing/sections/HeroSection";
import StatsSection from "../landing/sections/StatsSection";
import AboutSection from "../landing/sections/AboutSection";
import ServicesSection from "../landing/sections/ServicesSection";
import FeaturedPropertiesSection from "../landing/sections/FeaturedPropertiesSection";
import ProfessionalExcellenceSection from "../landing/sections/ProfessionalExcellenceSection";
import ContactSection from "../landing/sections/ContactSection";

export default function LandingPage() {
  const [selectedListingId, setSelectedListingId] = useState(null);

  const PropertyDetailModal = lazy(() => import("../components/PropertyDetailModal"));

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <ServicesSection />
        <FeaturedPropertiesSection onSelectListing={setSelectedListingId} />
        <ProfessionalExcellenceSection />
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
