"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import FeatureDeepDives from "@/components/landing/FeatureDeepDives";
import PersonaSection from "@/components/landing/PersonaSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main>
                <Hero />
                <TrustBar />
                <ProblemSection />
                <SolutionSection />
                <FeatureDeepDives />
                <PersonaSection />
                <HowItWorks />
                <FAQSection />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
