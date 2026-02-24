import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logo from '../assets/logo.png'; // Removed to fix 'logo is declared but never read' error
import anand from '../assets/anand.png';
import dinesh from '../assets/DINESH.jpeg';
import sumedha from '../assets/sumedha.jpeg';
import dhanush from '../assets/dhanush.jpeg';
import renin from '../assets/renin.jpeg';
import './Landing.css';

gsap.registerPlugin(ScrollTrigger);

const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 12; // Adjusted for subtle effect
    const rotateY = ((centerX - x) / centerX) * 12;

    setRotate({ x: rotateX, y: rotateY });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setRotate({ x: 0, y: 0 });
      }}
      className={`${className} transition-all duration-200 ease-out`}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        boxShadow: isHovering
          ? '0 30px 60px -12px rgba(0,0,0,0.4), 0 18px 36px -18px rgba(0,0,0,0.5)'
          : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        transition: isHovering ? 'none' : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease',
        transformStyle: 'preserve-3d'
      }}
    >
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </div>
  );
};

/*const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="8" fill="#E67E22" />
    <path
      d="M20 10C20 10 24 14 24 18C24 22 20 26 20 26V10ZM20 10C20 10 16 14 16 18C16 22 20 26 20 26V10Z"
      fill="white"
      fillOpacity="0.8"
    />
    <circle cx="20" cy="18" r="3" fill="white" />
    <path
      d="M12 28H28"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);*/

const teamMembers = [
  { role: "Project Lead", desc: "Operations", image: anand },
  { role: "AI Engineer", desc: "ML Lead", image: dhanush },
  { role: "Systems Arch", desc: "Arch", image: dinesh },
  { role: "Pharma Advisor", desc: "QC Spec", image: sumedha },
  { role: "Analyst", desc: "Market", image: renin }
];

const Landing: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Scroll Listener for Navbar Morph
  useEffect(() => {
    const handleScroll = () => {
      // Navbar Morph State
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP ScrollTrigger for Table Scaling
  useEffect(() => {
    if (!tableRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(tableRef.current,
        {
          scale: 0.85,
          opacity: 0.7,
          transformOrigin: "center center"
        },
        {
          scale: 1.05,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: tableRef.current,
            start: "top bottom", // when the top of the table hits the bottom of the viewport
            end: "center center", // when the center of the table hits the center of the viewport
            scrub: 1.5, // smooth scrubbing, takes 1.5s to "catch up" to the scrollbar
            toggleActions: "play reverse play reverse"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen font-sans text-ayurveda-green bg-ayurveda-light overflow-x-hidden relative">

      {/* 0. MORPHING NAVBAR */}
      <nav className={`navbar-premium ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container mx-auto px-6 md:px-12 lg:px-20 flex justify-between items-center">
          <div className="navbar-logo flex items-center cursor-pointer group">
            <div className="w-10 h-10 mr-2 rounded-lg flex items-center justify-center shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg" />
            </div>
            <span className={`text-xl md:text-2xl font-serif font-bold tracking-tighter transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-ayurveda'}`}>Drug Secure</span>
          </div>

          <div className="hidden md:flex items-center">
            {['Solution', 'Market', 'Roadmap', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`nav-link text-xs font-bold uppercase tracking-[0.2em] hover:text-ayurveda-accent transition-colors ${isScrolled ? 'text-white/90' : 'text-ayurveda-green/80'}`}
              >
                {item}
              </a>
            ))}
            <button className={`ml-8 btn-premium px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${isScrolled ? 'bg-white text-ayurveda-green border-none' : 'border-2 border-ayurveda-green text-ayurveda-green hover:bg-ayurveda-green hover:text-white'}`}>
              Dashboard
            </button>
          </div>

          <div className="md:hidden">
            <svg className={`w-6 h-6 ${isScrolled ? 'text-white' : 'text-ayurveda-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </div>
        </div>
      </nav>

      {/* SCROLL BLUR OVERLAY */}
      <div className="scroll-blur-overlay"></div>

      {/* GLOBAL WRAPPER FOR SIDE SPACING AND PREMIUM FEEL */}
      <div className="max-w-[1600px] mx-auto shadow-2xl bg-white/30 relative">

        {/* 1. HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-ayurveda-beige/30 bg-ayurveda-light  pt-20">


          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center z-10 py-20 text-ayurveda-green">
            <div className="inline-block px-4 py-1 rounded-full bg-ayurveda-accent/10 text-ayurveda-accent text-sm font-semibold mb-6 tracking-wider uppercase border border-ayurveda-accent/20 animate-pulse">
              AI-Powered Standardization
            </div>
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight max-w-5xl mx-auto italic font-serif">
              Standardization System for <span className="text-ayurveda-accent">Ayurvedic Drug</span> Quality Control
            </h1>
            <p className="text-base md:text-xl lg:text-2xl mb-4 font-light text-ayurveda-green/80 max-w-3xl mx-auto">
              Bridging 5,000 years of traditional wisdom with the precision of modern data science.
            </p>
            <p className="text-base md:text-lg lg:text-xl mb-10 font-medium text-ayurveda-green/70 max-w-2xl mx-auto leading-relaxed">
              Utilizing E-Tongue technology and K-Means clustering to ensure batch-to-batch consistency and global compliance for Ayurvedic manufacturers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-premium px-8 py-4 bg-ayurveda-green text-white rounded-lg hover:bg-ayurveda-accent transition-all duration-300 shadow-xl hover:shadow-ayurveda-accent/20 font-semibold tracking-wide">
                Learn More
              </button>
              <button className="btn-premium px-8 py-4 border-2 border-ayurveda-green text-ayurveda-green rounded-lg hover:bg-ayurveda-green hover:text-white transition-all duration-300 font-semibold tracking-wide">
                Explore Methodology
              </button>
            </div>
          </div>
        </section>

        {/* 2. OUR SOLUTION */}
        <section id="solution" className="py-24 bg-white relative">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2 order-2 md:order-1">
                <div className="relative ">
                  <div className="absolute -inset-4 bg-ayurveda-accent/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <div className="relative p-8 md:p-12 bg-white rounded-[3rem] border border-ayurveda-beige/30 shadow-2xl">
                    <div className="space-y-12 text-left">
                      <div className="flex items-center gap-8">
                        <div className="text-4xl md:text-5xl font-serif text-ayurveda-accent opacity-30 italic leading-none shrink-0">01</div>
                        <div>
                          <h4 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-tight font-serif">E-Tongue Chemical Fingerprinting</h4>
                          <p className="text-ayurveda-green/70 text-sm">Advanced electrochemical sensors capture the multi-dimensional taste profile and ionic composition of medicine batches.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-4xl md:text-5xl font-serif text-tech-blue opacity-30 italic leading-none shrink-0">02</div>
                        <div>
                          <h4 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-tight font-serif">AI-Based K-Means Clustering</h4>
                          <p className="text-ayurveda-green/70 text-sm">Unsupervised machine learning identifies patterns in high-dimensional data, grouping batches based on chemical similarity.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 order-1 md:order-2 text-left">
                <h2 className=" text-3xl md:text-4xl font-bold mb-8 leading-tight font-serif">
                  Synthesizing Tradition <br />
                  <span className="text-tech-blue">with Algorithmic Rigor</span>
                </h2>
                <div className="space-y-6 text-base md:text-lg text-ayurveda-green/80">
                  <p>
                    Our system converts the abstract Ayurvedic concept of <span className="italic font-medium">Rasa</span> (Taste) into a digital fingerprint. By extracting key chemical parameters and using K-Means Clustering, we move beyond binary pass/fail tests.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-6">
                    {['Feature Scaling', 'PCA Mapping', 'Variance Scoring', 'Confidence Index'].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-ayurveda-accent shrink-0"></div>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ayurveda-green/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TECHNICAL PIPELINE */}
        <section className="py-24 bg-ayurveda-light/50 border-y border-ayurveda-beige/20 shadow-inner">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-16 text-center uppercase tracking-widest text-ayurveda-green/40 font-serif">Technical Pipeline</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12 text-left">
                <div className="space-y-6 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-ayurveda-beige/20 shadow-sm transition-all duration-500 hover:backdrop-blur-xl hover:shadow-2xl hover:-translate-y-2 group">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-3 border-b border-ayurveda-beige pb-4 tracking-tighter font-serif">
                    <span className="w-6 h-6 flex items-center justify-center bg-ayurveda-green text-white text-xs rounded shrink-0 group-hover:scale-110 transition-transform duration-500">1</span>
                    INPUT PARAMETERS
                  </h3>
                  <ul className="space-y-3 font-sans text-[10px] md:text-xs text-ayurveda-green/70">
                    {['pH Level (H+ Conc.)', 'Electrical Conductivity', 'Total Disolved (TDS)', 'Bitterness Index (%)', 'Absorbance Metrics'].map((li, i) => (
                      <li key={i} className="flex gap-2"><span className="opacity-50 tracking-tighter shrink-0">{`>`}</span> <span>{li}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-ayurveda-beige/20 shadow-sm transition-all duration-500 hover:backdrop-blur-xl hover:shadow-2xl hover:-translate-y-2 group">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-3 border-b border-ayurveda-beige pb-4 tracking-tighter font-serif">
                    <span className="w-6 h-6 flex items-center justify-center bg-tech-blue text-white text-xs rounded shrink-0 group-hover:scale-110 transition-transform duration-500">2</span>
                    PROCESSING (ML)
                  </h3>
                  <ul className="space-y-3 font-sans text-[10px] md:text-xs text-ayurveda-green/70">
                    {['Standard Scaling', 'K-Means Clustering', 'PCA Visualization', 'Euclidean Calculations'].map((li, i) => (
                      <li key={i} className="flex gap-2"><span className="opacity-50 tracking-tighter shrink-0">{`>`}</span> <span>{li}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6 bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-ayurveda-beige/20 shadow-sm transition-all duration-500 hover:backdrop-blur-xl hover:shadow-2xl hover:-translate-y-2 group">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-3 border-b border-ayurveda-beige pb-4 tracking-tighter font-serif">
                    <span className="w-6 h-6 flex items-center justify-center bg-ayurveda-accent text-white text-xs rounded shrink-0 group-hover:scale-110 transition-transform duration-500">3</span>
                    OUTPUT METRICS
                  </h3>
                  <ul className="space-y-3 font-sans text-[10px] md:text-xs text-ayurveda-green/70">
                    {['Cluster Membership', 'Centroid Deviation', 'Quality Conf. Score', 'Export QC Cert'].map((li, i) => (
                      <li key={i} className="flex gap-2"><span className="opacity-50 tracking-tighter shrink-0">{`>`}</span> <span className="truncate">{li}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON - DYNAMIC SCALING */}
        <section id="comparison" className="py-24 bg-white relative">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="text-center mb-16">
              <h2 className=" text-[10px] font-bold uppercase tracking-[0.6em] text-ayurveda-green/30 mb-6 italic">Benchmarks & Metrics</h2>
              <h3 className="text-3xl md:text-5xl font-bold italic tracking-tight font-serif">Traditional Testing vs. <br /><span className="text-tech-blue underline decoration-tech-blue/20 underline-offset-[12px]">AI Clustering System</span></h3>
            </div>

            <div
              ref={tableRef}
              className="max-w-6xl mx-auto overflow-hidden rounded-[1.5rem] md:rounded-[3.5rem] border border-ayurveda-beige/40 shadow-2xl bg-white relative will-change-transform"
            >
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-[700px]">
                  <thead>
                    <tr className="bg-ayurveda-green text-white">
                      <th className="p-6 md:p-10 font-bold uppercase tracking-widest text-xs italic font-serif">Strategic Indicator</th>
                      <th className="p-6 md:p-10 font-bold uppercase tracking-widest text-xs border-l border-white/5 italic font-serif">Manual Protocols</th>
                      <th className="p-6 md:p-10 font-bold uppercase tracking-widest text-xs border-l border-white/5 bg-tech-blue italic font-serif">AI Infrastructure</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm md:text-lg">
                    {[
                      { label: "Validation", manual: "Subjective Observation", ai: "Automated Unsupervised ML" },
                      { label: "Velocity", manual: "Weeks per Batch Sequence", ai: "Real-time Processing" },
                      { label: "Pattern Identification", manual: "Limited to Raw Indicators", ai: "High-Dimensional Mapping" },
                      { label: "Consistency Logic", manual: "Reactive Fault Detection", ai: "Predictive Quality Confidence" }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-ayurveda-beige/20 hover:bg-ayurveda-light/40 transition-all duration-300">
                        <td className="p-6 md:p-10 font-bold text-xs md:text-sm uppercase">{row.label}</td>
                        <td className="p-6 md:p-10 text-ayurveda-green/50 border-l italic font-light font-serif">{row.manual}</td>
                        <td className="p-6 md:p-10 text-tech-blue font-bold border-l bg-tech-blue/[0.02]">{row.ai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5. PROBLEM SECTION */}
        <section id="problem" className="py-24 bg-white/50 relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 text-left">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <h2 className=" text-3xl md:text-4xl font-bold mb-8 leading-tight font-serif">
                  The Crisis of Consistency in <br />
                  <span className="text-ayurveda-accent">Traditional Medicine</span>
                </h2>
                <div className="space-y-6 text-base md:text-lg text-ayurveda-green/80 leading-relaxed">
                  <p>
                    While the global demand for Ayurveda grows at <span className="font-bold text-ayurveda-green">15% CAGR</span>, the industry faces a critical bottleneck: the lack of rigorous chemical standardization.
                  </p>
                  <p>
                    Herbal products naturally suffer from <span className="italic">batch-to-batch variability</span>. Traditional methods rely on subjective manual dependency, leading to:
                  </p>
                  <ul className="list-none space-y-4">
                    {["Inconsistent therapeutic efficacy across production slots.", "Severe challenges in meeting stringent EU and US export compliance.", 'Lack of a universal "digital signature" for quality assurance.'].map((point, i) => (
                      <li key={i} className="flex items-start gap-3  ">
                        <span className="text-red-500 mt-1.5 shrink-0 text-[8px]">●</span>
                        <span className="text-sm md:text-base">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 md:p-8 bg-ayurveda-light rounded-3xl border border-ayurveda-beige/40">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-ayurveda-beige/20 hover:scale-[1.02] transition-transform duration-300">
                  <div className="text-3xl md:text-4xl font-bold text-ayurveda-accent mb-2">40%</div>
                  <div className="text-[10px] text-ayurveda-green/60 uppercase tracking-wider font-bold">Variability</div>
                  <p className="text-xs mt-2 text-ayurveda-green/70">Average chemical deviation in non-standardized batches.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-ayurveda-beige/20 hover:scale-[1.02] transition-transform duration-300">
                  <div className="text-3xl md:text-4xl font-bold text-tech-blue mb-2">65%</div>
                  <div className="text-[10px] text-ayurveda-green/60 uppercase tracking-wider font-bold">Export Rejection</div>
                  <p className="text-xs mt-2 text-ayurveda-green/70">Percentage of rejections due to batch inconsistency.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. WHY CURRENT METHODS FALL SHORT */}
        <section id="why" className="py-24 bg-[linear-gradient(135deg,_#0d1f17_0%,_#1a3a2a_40%,_#0d2433_100%)] text-[#a8c5a0] relative">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-left">
            <div className="text-center mb-16">
              <h2 className=" text-2xl md:text-4xl font-bold mb-4 font-serif">Limitations of Modern QC</h2>
              <div className="h-1 w-24 bg-ayurveda-accent mx-auto"></div>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 overflow-visible">
              {[
                { title: "Subjective Evaluation", color: "bg-ayurveda-accent", desc: "Reliance on sensory perception lacks pharmaceutical-grade precision." },
                { title: "Slow Lab Cycles", color: "bg-tech-blue", desc: "Chemical analysis takes weeks, creating production bottlenecks." },
                { title: "No Pattern Rec.", color: "bg-purple-500", desc: "Raw data remains fragmented; modern systems fail to identify clusters." },
                { title: "No Consistency Score", color: "bg-orange-500", desc: "Manufacturers lack a standardized variance score for brand uniformity." }
              ].map((item, i) => (
                <TiltCard key={i} className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10">
                  <h3 className="text-lg md:text-xl font-bold mb-4 font-serif">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed text-xs md:text-sm">{item.desc}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* 7. BIOLOGICAL FOUNDATION */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] opacity-[0.05] pointer-events-none"></div>
          <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10 text-left">
            <div className="max-w-3xl">
              <h2 className=" text-3xl md:text-4xl font-bold mb-8 italic font-serif">The Science of Rasa-Guna</h2>
              <div className="space-y-6 text-lg md:text-xl text-ayurveda-green/80 leading-relaxed font-light font-serif">
                <p className=" ">
                  In Ayurveda, the <span className="font-medium">Rasa</span> (Taste) is a direct indicator of <span className="font-medium text-ayurveda-accent italic">phytochemical composition</span>.
                </p>
                <p className=" ">
                  By leveraging E-Tongue technology, we bridge this traditional knowledge with quantitative science.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. IMPACT */}
        <section id="impact" className="py-24 bg-ayurveda-light relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-left">
            <h2 className=" text-2xl md:text-3xl font-bold mb-16 text-center uppercase tracking-[0.3em] text-ayurveda-green italic font-serif">Ecosystem Impact</h2>
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {[
                { title: "For Manufacturers", color: "bg-ayurveda-accent", desc: "Eliminate guesswork. Monitor batch consistency in real-time." },
                { title: "For Regulators", color: "bg-ayurveda-green", desc: "Automated QC support for validating export compliance." },
                { title: "For Consumers", color: "bg-ayurveda-accent", desc: "Access safer, standardized herbal products with guaranteed efficacy." }
              ].map((item, i) => (
                <div key={i} className={` space-y-6 group`}>
                  <div className={`h-1 shadow-sm w-12 ${item.color} group-hover:w-24 transition-all duration-500`}></div>
                  <h3 className="text-xl md:text-2xl font-bold italic font-serif text-ayurveda-green">{item.title}</h3>
                  <p className="text-ayurveda-green/70 leading-relaxed font-light text-xs md:text-sm italic">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. MARKET OPPORTUNITY */}
        <section id="market" className="py-20 md:py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className=" text-3xl md:text-4xl font-bold mb-6 md:mb-10 italic font-serif">Global Opportunity</h2>
                <p className="text-base md:text-lg text-ayurveda-green/80 font-light leading-relaxed">
                  The Indian Ayurveda industry is projected to reach <span className="font-bold text-ayurveda-green">$16 Billion</span> by 2026. Standardization is the singular barrier to dominance.
                </p>
              </div>
              <div className="p-8 md:p-10 bg-ayurveda-light rounded-[2rem] md:rounded-[3rem] border border-ayurveda-beige/40 text-center shadow-xl">
                <h4 className="text-lg md:text-xl md:text-2xl font-bold mb-6 md:mb-8 italic text-ayurveda-green font-serif">"Standardization is the bridge between wisdom and pharmaceutical dominance."</h4>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-ayurveda-green/40">Market Analysis 2026</p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. ROADMAP */}
        <section id="roadmap" className=" py-20 md:py-32 bg-[linear-gradient(135deg,_#0d1f17_0%,_#1a3a2a_40%,_#0d2433_100%)] text-[#a8c5a0] relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-left">
            <h2 className=" text-3xl md:text-4xl font-bold mb-16 md:mb-24 text-center italic tracking-tight font-serif">Roadmap 2026</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 overflow-visible">
              {[
                { phase: "01", title: "Dataset Engineering", desc: "Refining K-Means hyperparameters using synthetic chemical profiles." },
                { phase: "02", title: "Sensor Validation", desc: "Laboratory-grade E-Tongue integration and deep-linking signatures." },
                { phase: "03", title: "Regulatory Audit", desc: "Obtaining certifications by cross-verifying AI scores against standards." },
                { phase: "04", title: "Global Cloud Launch", desc: "Full-scale SaaS deployment with IoT-enabled sensor hubs." }
              ].map((item, i) => (
                <div key={i} className="space-y-6 bg-white/4 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-white/10 relative min-h-[300px] flex flex-col transition-all duration-500 hover:backdrop-blur-xl hover:shadow-2xl hover:-translate-y-2 group">
                  <div className="text-ayurveda font-bold text-[10px] mb-8 uppercase tracking-[0.3em] group-hover:scale-110 transition-transform duration-500">Phase {item.phase}</div>
                  <h3 className="text-xl md:text-2xl font-bold mb-8 italic font-serif">{item.title}</h3>
                  <p className="text-green-200 text-[12px] leading-relaxed mt-auto font-light italic">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. TEAM SECTION */}
        <section id="team" className=" py-20 md:py-32 bg-white relative">
          <div className="container mx-auto px-4 md:px-12 lg:px-20 text-center">
            <h2 className=" text-[13px] md:text-[15px] font-bold uppercase tracking-[0.5em] md:tracking-[0.7em] text-ayurveda mb-12 md:mb-20 italic font-serif">Drug Secure Squad</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-16 max-w-6xl mx-auto">
              {teamMembers.map((member, i) => (
                <div key={i} className={` space-y-6 group`}>
                  <div className="w-full aspect-square bg-ayurveda-light rounded-[2rem] flex items-center justify-center border border-ayurveda-beige/20 shadow-inner hover:shadow-2xl transition-all duration-700 overflow-hidden bg-white">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.role}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-ayurveda opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    )}
                  </div>
                  <h4 className="font-bold text-lg italic tracking-tighter font-serif">{member.role}</h4>
                  <p className="text-[9px] uppercase font-bold tracking-[0.3em] opacity-40 italic text-ayurveda-green/90">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 12. FAQ SECTION */}
        <section id="faq" className=" py-32 bg-ayurveda-light/30 border-t border-ayurveda-beige/20 shadow-inner relative">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-4xl text-left">
            <div className="text-center mb-20">
              <h2 className=" text-3xl md:text-4xl font-bold italic font-serif">Technical Inquiry (FAQ)</h2>
            </div>
            <div className="space-y-6">
              {[
                { q: "Why K-Means for AI QC?", a: "It enables discovery of inherent data structures in multi-dimensional fingerprints without bias." },
                { q: "What defines success metrics?", a: "Success is defined by Intra-cluster variance. Minimizing centroid distance guarantees consistency." }
              ].map((faq, idx) => (
                <div key={idx} className={` bg-white border border-ayurveda-beige/40 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 group`}>
                  <div className="p-8 font-bold text-ayurveda border-b border-ayurveda-beige/10 flex justify-between items-center group-hover:bg-ayurveda-accent/5 cursor-pointer">
                    <span className="italic text-base md:text-lg font-serif">{faq.q}</span>
                    <div className="w-8 h-8 rounded-full border border-ayurveda-accent/20 flex items-center justify-center text-ayurveda-accent transition-all group-hover:rotate-45">+</div>
                  </div>
                  <div className="p-10 text-ayurveda-green/90 leading-relaxed font-light text-xs md:text-sm italic">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 13. FOOTER */}
        <footer className="py-24 bg-[radial-gradient(ellipse_at_top,_#1a3a2a_0%,_#0a1628_60%,_#050d14_100%)] text-white text-center border-t border-white/5 relative overflow-hidden flex flex-col items-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
            <div className="mb-10 flex flex-col items-center group">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 opacity-30 group-hover:opacity-100 transition-all duration-300">
                {/*<Logo className="w-12 h-12" />*/}
                <img src="/logo.png" alt="logo" className="w-12 h-12" />
              </div>
              <div className="opacity-30 tracking-[0.8em] italic font-bold text-[10px] uppercase">
                DRUG SECURE QUALITY SYSTEMS / 2026
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-10 md:gap-20 text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 italic">
              <a href="#" className="hover:text-ayurveda-accent transition-colors underline decoration-white/10 underline-offset-[12px] hover:decoration-ayurveda-accent">Hackathon</a>
              <a href="mailto:contact@drugsecure.ai" className="hover:text-ayurveda-accent transition-colors underline decoration-white/10 underline-offset-[12px] hover:decoration-ayurveda-accent">Liaison</a>
              <a href="#" className="hover:text-ayurveda-accent transition-colors underline decoration-white/10 underline-offset-[12px] hover:decoration-ayurveda-accent">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
