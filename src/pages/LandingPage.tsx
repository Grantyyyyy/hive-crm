import React, { useState } from "react";
import { CtaSection } from "../components/landing/CtaSection";
import { FaqSection } from "../components/landing/FaqSection";
import { FooterSection } from "../components/landing/FooterSection";
import { HeroSection } from "../components/landing/HeroSection";
import { ModulesSection } from "../components/landing/ModulesSection";
import { PartnersStrip } from "../components/landing/PartnersStrip";
import { PricingSection } from "../components/landing/PricingSection";
import { ShowcaseSection } from "../components/landing/ShowcaseSection";
import { StatsSection } from "../components/landing/StatsSection";
import { ThemeToggle } from "../components/landing/ThemeToggle";
import type { LandingTheme } from "../components/landing/types";

export const LandingPage: React.FC = () => {
  const [theme, setTheme] = useState<LandingTheme>("light");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#0D9488] selection:text-white overflow-x-hidden transition-colors ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-[#F8FAFC] text-slate-900"
        }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
      `}</style>

      <ThemeToggle theme={theme} onToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))} />
      <HeroSection theme={theme} />
      <PartnersStrip theme={theme} />
      <ModulesSection theme={theme} />
      <ShowcaseSection theme={theme} />
      <StatsSection theme={theme} />
      <PricingSection theme={theme} />
      <FaqSection theme={theme} activeFaq={activeFaq} onToggleFaq={(index) => setActiveFaq(activeFaq === index ? null : index)} />
      <CtaSection theme={theme} email={email} onEmailChange={setEmail} />
      <FooterSection theme={theme} />

    </div>
  );
};