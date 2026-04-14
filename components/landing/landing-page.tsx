"use client";

import AOS from "aos";
import { useEffect } from "react";

import { Footer, CTASection, FAQSection } from "./faq-footer";
import { HeroSection, StatsSection } from "./hero";
import { PricingSection, TestimonialsSection } from "./pricing-social";
import { FeaturesSection, HowItWorksSection } from "./process-features";
import { Navbar } from "./shared";

export default function LandingPage() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 850,
      easing: "ease-out-cubic",
      offset: 72,
      anchorPlacement: "top-bottom",
    });

    AOS.refresh();
  }, []);

  return (
    <main className="overflow-x-hidden bg-[#fffaf4] text-[#102033]">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
