import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import StatsBand from "../components/StatsBand";
import About from "../components/About";
import Services from "../components/Services";
import PropertyCarousel from "../components/PropertyCarousel";
import PropertyDetailModal from "../components/PropertyDetailModal";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function LandingPage() {
  const [selectedListingId, setSelectedListingId] = useState(null);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBand />
        <About />
        <Services />
        <PropertyCarousel onSelectListing={setSelectedListingId} />
        <Contact />
      </main>
      <Footer />
      {selectedListingId != null && (
        <PropertyDetailModal
          listingId={selectedListingId}
          onClose={() => setSelectedListingId(null)}
        />
      )}
    </>
  );
}
