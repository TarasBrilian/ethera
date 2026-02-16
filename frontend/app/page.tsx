"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll(".animate-on-scroll");
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#0E0E0E] text-[#F5F5F0] overflow-x-hidden selection:bg-[#C9A84C]/30 relative z-[60]">
      {/* Hide global components that might be in layout */}
      <style jsx global>{`
        nav:not(#ethera-nav), #global-background { display: none !important; }
        body { background-color: #0E0E0E !important; }
      `}</style>

      {/* Navigation Bar */}
      <nav
        id="ethera-nav"
        className={`fixed top-0 left-0 w-full z-[70] transition-all duration-500 px-6 py-4 md:px-12 md:py-6 ${isScrolled ? "bg-[#0E0E0E]/90 backdrop-blur-md border-b border-white/5" : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={` text-[#C9A84C] text-2x md:text-3xl font-bold tracking-tight`}>ETHERA</span>
            <span className="text-[10px] font-mono text-[#9A9A8E] uppercase tracking-widest mt-1">Money</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A9A8E]">
            <a href="#how-it-works" className="hover:text-[#F5F5F0] transition-colors">How It Works</a>
            <Link href="https://github.com/ethera-money/frontend/blob/main/README.md" target="_blank" className="hover:text-[#F5F5F0] transition-colors">Docs</Link>
            <Link href="/stake" className="px-6 py-2 bg-[#C9A84C] text-[#0E0E0E] font-bold rounded-sm hover:bg-[#D4B96A] transition-all">App</Link>
          </div>
          <div className="md:hidden">
            <Link href="/stake" className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest">App</Link>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 md:pt-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold leading-snug md:leading-tight mb-6 md:mb-10 transition-all duration-1000 opacity-0 translate-y-10 animate-fade-in">
            The dollar you saved 10 years ago can't buy what it used to. <br className="hidden md:block" />
            <span className="text-[#C9A84C]">ETHERA can.</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-[#9A9A8E] mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed md:leading-loose transition-all duration-1000 delay-300 opacity-0 translate-y-10 animate-fade-in">
            ETHERA is a stablecoin built to hold real value not a dollar price. Backed by hard assets and Ethereum, its purchasing power stays intact while everything else inflates away.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 transition-all duration-1000 delay-500 opacity-0 translate-y-10 animate-fade-in">
            <Link href="/stake" className="px-10 py-5 bg-[#C9A84C] text-[#0E0E0E] font-bold text-lg rounded-sm hover:scale-105 transition-transform shadow-[0_0_30px_rgba(201,168,76,0.3)]">
              Mint ETHERA Free to Hold
            </Link>
            <a href="#how-it-works" className="text-[#9A9A8E] hover:text-[#F5F5F0] transition-colors group text-lg font-medium">
              See how it keeps its value <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>

        {/* Subtle Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#C9A84C]/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      </section>

      {/* Section 2: Contrast Block */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {/* Left Card */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 bg-[#1A1A18] border border-white/5 p-8 md:p-16 lg:p-20 flex flex-col items-center text-center group">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#9A9A8E] mb-8 md:mb-10 font-bold">Regular Stablecoins</span>
              <div className="mb-8 md:mb-12 relative w-20 h-20 md:w-24 md:h-24">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-95 transition-transform">
                  <span className="text-2xl md:text-3xl font-light text-white/20">$</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A1A18]/50 to-[#1A1A18] h-full w-full opacity-60" />
              </div>
              <h3 className="text-2xl md:text-3xl font-light mb-3 md:mb-4 leading-snug">Worth $1 today</h3>
              <p className="text-[#9A9A8E] mb-2 font-light text-sm md:text-base leading-relaxed">Worth $1 in 10 years</p>
              <p className="text-white/40 font-medium italic text-base md:text-lg mt-4 leading-relaxed">But $1 buys less every year</p>
            </div>

            {/* Right Card */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200 bg-[#1A1A18] border border-[#C9A84C]/30 p-8 md:p-16 lg:p-20 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6">
                <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-ping" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C9A84C] mb-8 md:mb-10 font-bold">ETHERA</span>
              <div className="mb-8 md:mb-12">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#C9A84C] flex items-center justify-center shadow-[0_0_50px_rgba(201,168,76,0.25)] group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 text-[#0E0E0E]" fill="currentColor">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-light mb-3 md:mb-4 text-[#F5F5F0] leading-snug">Buys a coffee today</h3>
              <p className="text-[#9A9A8E] mb-2 font-light text-sm md:text-base leading-relaxed">Buys a coffee in 10 years</p>
              <p className="text-[#C9A84C] font-bold text-base md:text-lg mt-4 uppercase tracking-widest leading-relaxed">Same real value. Always.</p>
            </div>
          </div>
          <div className="mt-16 md:mt-20 text-center">
            <p className="text-lg md:text-xl lg:text-2xl text-[#9A9A8E] font-light max-w-2xl mx-auto italic leading-relaxed md:leading-loose">
              "ETHERA doesn't track a price. It tracks what money is supposed to do."
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section id="how-it-works" className="py-24 md:py-40 px-6 bg-[#0B0B0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-20">
            {/* Step 1 */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] mb-6 md:mb-8 text-sm font-mono font-bold">01</div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 leading-snug">Deposit ETH</h3>
              <p className="text-[#9A9A8E] text-base md:text-lg leading-relaxed md:leading-loose font-light">
                Lock your ETH as collateral. It keeps earning staking yield while you hold ETHERA.
              </p>
            </div>

            {/* Step 2 */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] mb-6 md:mb-8 text-sm font-mono font-bold">02</div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#F5F5F0] leading-snug">Mint ETHERA at 0% Interest</h3>
              <p className="text-[#9A9A8E] text-base md:text-lg leading-relaxed md:leading-loose font-light">
                Your staking yield covers the cost. You borrow against real value, not a dollar price.
              </p>
            </div>

            {/* Step 3 */}
            <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-400">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] mb-6 md:mb-8 text-sm font-mono font-bold">03</div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 leading-snug">Hold Money That Holds Its Worth</h3>
              <p className="text-[#9A9A8E] text-base md:text-lg leading-relaxed md:leading-loose font-light">
                ETHERA's value is updated in real time using gold, energy prices, and onchain data so inflation can't eat it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Social Proof / Trust Anchors */}
      <section className="py-16 md:py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              <div className="text-[#C9A84C] mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-base md:text-lg text-[#F5F5F0] mb-2 leading-snug">CRE as Chainlink Oracles</h4>
              <p className="text-[9px] md:text-[10px] text-[#9A9A8E] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed">Real-time price verification</p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-100">
              <div className="text-[#C9A84C] mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-bold text-base md:text-lg text-[#F5F5F0] mb-2 leading-snug">ETH Collateral</h4>
              <p className="text-[9px] md:text-[10px] text-[#9A9A8E] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed">Backed by the hardest onchain asset</p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
              <div className="text-[#C9A84C] mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="font-bold text-base md:text-lg text-[#F5F5F0] mb-2 leading-snug">Open Source</h4>
              <p className="text-[9px] md:text-[10px] text-[#9A9A8E] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed">Fully auditable smart contracts</p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-300">
              <div className="text-[#C9A84C] mb-4 md:mb-6">
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-base md:text-lg text-[#F5F5F0] mb-2 leading-snug">0% Mint Interest</h4>
              <p className="text-[9px] md:text-[10px] text-[#9A9A8E] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] leading-relaxed">Yield-funded, not debt-funded</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Philosophical Anchor */}
      <section className="py-48 px-6 bg-[#000000] relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <blockquote className={`animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000  text-4xl md:text-6xl leading-tight mb-16 italic font-light`}>
            "Every currency in history has lost to inflation. ETHERA is built on the assumption that this will never change so it doesn't rely on any currency at all."
          </blockquote>
          <p className="text-[11px] uppercase tracking-[0.6em] text-[#C9A84C] font-black border-t border-[#C9A84C]/20 pt-8 inline-block">
            ETHERA Purchasing Power, Preserved Onchain
          </p>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[40vh] bg-[#C9A84C]/2 blur-[120px] -z-0" />
      </section>

      {/* Section 6: Final CTA */}
      <section className="py-40 px-6">
        <div className="max-w-4xl mx-auto text-center border-x border-b border-[#C9A84C]/20 bg-[#1A1A18] p-16 md:p-32 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C]" />
          <h2 className={` text-4xl md:text-6xl font-bold mb-12 leading-tight uppercase tracking-tighter`}>
            Ready to hold money that actually holds its value?
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <Link href="/stake" className="w-full md:w-auto px-16 py-5 bg-[#C9A84C] text-[#0E0E0E] font-bold text-xl rounded-sm hover:scale-105 transition-transform shadow-[0_0_40px_rgba(201,168,76,0.2)]">
              Mint ETHERA
            </Link>
            <Link href="https://github.com/ethera-money/frontend/blob/main/README.md" target="_blank" className="w-full md:w-auto px-16 py-5 border border-white/20 text-[#F5F5F0] font-bold text-xl rounded-sm hover:bg-white/5 transition-colors">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-[#000000] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-24">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 mb-6">
                <span className={` text-[#C9A84C] text-3xl font-bold tracking-tight`}>ETHERA</span>
                <span className="text-[10px] font-mono text-[#9A9A8E] uppercase tracking-widest mt-2 font-bold">Money</span>
              </div>
              <p className="text-[#9A9A8E] text-sm uppercase tracking-widest font-medium">Purchasing Power, Preserved.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-16 w-full md:w-auto">
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Protocol</h5>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-[#9A9A8E]">
                  <li><Link href="/stake" className="hover:text-[#C9A84C] transition-colors">Mint</Link></li>
                  <li><a href="#how-it-works" className="hover:text-[#C9A84C] transition-colors">How it Works</a></li>
                  <li><Link href="/docs" className="hover:text-[#C9A84C] transition-colors">Architecture</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Ecosystem</h5>
                <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-[#9A9A8E]">
                  <li><a href="https://github.com" target="_blank" className="hover:text-[#C9A84C] transition-colors">GitHub</a></li>
                  <li><a href="https://twitter.com" target="_blank" className="hover:text-[#C9A84C] transition-colors">Twitter</a></li>
                  <li><a href="https://discord.com" target="_blank" className="hover:text-[#F5F5F0] transition-colors">Discord</a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Security</h5>
                <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
                  <div className="w-10 h-10 rounded bg-[#2A5ADA] flex items-center justify-center p-2">
                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Oracle Powered by <br /> CRE Chainlink</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] text-center md:text-left">&copy; 2026 ETHERA MONEY PROTOCOL. ALL RIGHTS RESERVED. NO CURRENCY PEGGED.</p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/20">
              <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Hero Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </main>
  );
}
