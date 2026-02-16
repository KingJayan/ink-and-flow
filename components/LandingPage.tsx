import React, { useState, useEffect } from 'react';
import { Sparkles, PenTool, Wind, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';


interface LandingPageProps {
  onStartGuest: () => void;
  onLogin: () => void;
}

const SCREENSHOTS = [
  {
    id: 1,
    src: 'src/images/c4.png',
    alt: "Main Editor Interface",
    caption: "Focus on what matters—your words."
  },
  {
    id: 2,
    src: 'src/images/c2.png',
    alt: "Ghost Writer Suggestion",
    caption: "AI that suggests, never interrupts."
  },
  {
    id: 3,
    src: 'src/images/c3.png',
    alt: "Typography Settings",
    caption: "Customize your environment."
  },
  {
    id: 4,
    src: 'src/images/c1.png',
    alt: "Contextual Refinement",
    caption: "Refine and polish with ease."
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStartGuest, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SCREENSHOTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-desk dark:bg-[#121218] bg-paper-texture flex flex-col relative overflow-y-auto overflow-x-hidden selection:bg-sage/20 dark:selection:bg-white/10">

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sage/5 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy/5 dark:bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 md:px-12 relative z-10 animate-fade-in">
        <div className="group cursor-default">
          <Logo size={36} withText={true} />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onLogin}
            className="text-sm font-medium text-ink/70 dark:text-white/60 hover:text-ink dark:hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onLogin}
            className="hidden sm:block text-sm font-medium px-4 py-2 bg-white dark:bg-white/5 border border-wash-stone/40 dark:border-white/10 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-navy dark:text-blue-400"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-12 md:pt-20 pb-20 relative z-10">

        <div className="max-w-4xl w-full text-center space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-white/5 border border-wash-stone/20 dark:border-white/10 rounded-full shadow-sm backdrop-blur-sm mb-4">
            <Sparkles size={14} className="text-sage dark:text-blue-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-ink-faint dark:text-white/40">AI-Assisted Writing Environment</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-medium text-ink dark:text-white leading-[1.1] tracking-tight">
            Write without <span className="italic text-navy/80 dark:text-blue-400/80">resistance.</span>
          </h1>

          <p className="font-sans text-lg md:text-xl text-ink/60 dark:text-white/50 max-w-2xl mx-auto leading-relaxed">
            A distraction-free canvas that thinks with you.
            Experience the tactile joy of ink and the boundless potential of AI,
            blended into a single fluid workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 mb-16">
            <button
              onClick={onStartGuest}
              className="group relative flex items-center gap-3 px-8 py-4 bg-navy dark:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-navy/90 dark:hover:bg-blue-500 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              <span className="font-medium text-lg">Start Writing</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 border border-wash-stone/30 dark:border-white/10 text-ink dark:text-white rounded-xl shadow-sm hover:shadow-md hover:bg-paper dark:hover:bg-white/10 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
            >
              <span>Log In to Sync</span>
            </button>
          </div>
        </div>

        {/* macOS Style Window Carousel */}
        <div className="w-full max-w-5xl mx-auto relative animate-[fadeIn_1s_ease-out_forwards] opacity-0 px-4 md:px-0">
          <div className="relative bg-white dark:bg-[#1a1a22] rounded-xl md:rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10 ring-1 ring-black/5 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)]">

            {/* Window Header */}
            <div className="h-9 bg-[#f3f2f0] dark:bg-[#252530] border-b border-[#e5e5e5] dark:border-white/5 flex items-center px-4 justify-between select-none">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]/50 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]/50 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]/50 shadow-sm" />
              </div>
              <div className="text-[10px] font-medium text-ink-faint/60 dark:text-white/30 flex items-center gap-1">
                <Logo size={12} className="opacity-50" />
                <span>Ink & Flow — Editor</span>
              </div>
              <div className="w-14" /> {/* Spacer for balance */}
            </div>

            {/* Window Content (Carousel) */}
            <div className="relative aspect-video bg-desk dark:bg-[#121218] w-full overflow-hidden group/carousel">
              {SCREENSHOTS.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Caption Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 flex justify-center">
                    <span className="text-white/90 text-sm font-medium px-4 py-1.5 bg-black/30 dark:bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                      {slide.caption}
                    </span>
                  </div>
                </div>
              ))}

              {/* Navigation Dots */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {SCREENSHOTS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`
                      h-2 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm
                      ${idx === currentSlide
                        ? 'bg-white w-6 opacity-100'
                        : 'bg-white/50 w-2 hover:bg-white/80 opacity-70'}
                    `}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feature Grid Below Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 px-4">
            <FeatureCard
              icon={Wind}
              title="Flow State"
              desc="Minimalist interface designed to keep you focused on the words."
            />
            <FeatureCard
              icon={Sparkles}
              title="Ghost Writer"
              desc="AI that suggests completions when you're stuck, maintaining your tone."
            />
            <FeatureCard
              icon={PenTool}
              title="Tactile Feel"
              desc="A digital environment that feels as grounded as pen on paper."
            />
          </div>
        </div>
      </main>

      <div className="h-20"></div> {/* Spacer */}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/50 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
    <div className="w-10 h-10 bg-desk dark:bg-white/5 rounded-lg flex items-center justify-center mb-4 text-navy dark:text-blue-400">
      <Icon size={20} />
    </div>
    <h3 className="font-serif font-bold text-ink dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-ink-faint dark:text-white/40 leading-relaxed">{desc}</p>
  </div>
);