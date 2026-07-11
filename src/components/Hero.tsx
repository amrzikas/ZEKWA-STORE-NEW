import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  isArabic: boolean;
  onExploreClick: () => void;
  onAiClick: () => void;
  heroTitle?: string;
  heroTitleAr?: string;
  heroSubtitle?: string;
  heroSubtitleAr?: string;
  heroBg?: string;
  heroBg2?: string;
  heroBg3?: string;
  heroBg4?: string;
  heroLayout?: string;
}

export default function Hero({ 
  isArabic, 
  onExploreClick, 
  onAiClick,
  heroTitle,
  heroTitleAr,
  heroSubtitle,
  heroSubtitleAr,
  heroBg,
  heroBg2,
  heroBg3,
  heroBg4,
  heroLayout = 'standard'
}: HeroProps) {
  const images = [
    heroBg || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    heroBg2,
    heroBg3,
    heroBg4
  ].filter(Boolean) as string[];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (heroLayout !== 'carousel' || images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length, heroLayout]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-br from-sky-100 via-indigo-50/50 to-white text-slate-800 rounded-[3rem] pt-12 pb-16 lg:pb-24 mt-6 shadow-2xl shadow-indigo-100/40 max-w-7xl mx-auto border border-sky-100/50" 
      id="zewka-hero"
    >
      {/* Abstract light-blue glowing backdrop shapes to match the image's wavy background */}
      <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-sky-200/40 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute left-0 bottom-0 w-[350px] h-[350px] rounded-full bg-indigo-200/30 blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text block */}
          <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[10px] sm:text-xs font-black rounded-full uppercase tracking-widest mb-6 self-center lg:self-start shadow-lg shadow-indigo-600/10"
            >
              <span>{isArabic ? 'بوابة التسوق الذكية ★ زيوكا' : 'ZEWKA Premium Boutique ★ Live'}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-5 tracking-tight font-sans"
            >
              {isArabic ? (
                heroTitleAr ? (
                  <span className="text-slate-900 bg-gradient-to-r from-indigo-800 via-indigo-600 to-sky-500 bg-clip-text text-transparent">{heroTitleAr}</span>
                ) : (
                  <>
                    تسوّق ذكي<br />
                    <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">يتداخل مع واقعك.</span>
                  </>
                )
              ) : (
                heroTitle ? (
                  <span className="text-slate-900 bg-gradient-to-r from-indigo-800 via-indigo-600 to-sky-500 bg-clip-text text-transparent">{heroTitle}</span>
                ) : (
                  <>
                    Luxe Shopping<br />
                    <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">Blending with Reality.</span>
                  </>
                )
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 font-medium font-sans"
            >
              {isArabic
                ? heroSubtitleAr || 'ندمج التصميم الراقي والموضة الحصرية مع تجارب التسوق المستقبلية. استكشف فئات الملابس، العناية الطبيعية، والمستلزمات الفنية المنتقاة بعناية لتعكس فخامة ذوقك.'
                : heroSubtitle || 'Merging state-of-the-art interactive 3D concepts with silent luxury. Browse masterfully tailored apparel, premium organic wellness, artisan home decor, and bespoke tech accessories.'}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isArabic ? 'ابدأ الاستكشاف' : 'Explore Curation'}</span>
                <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={onAiClick}
                className="w-full sm:w-auto px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                <span>{isArabic ? 'استشارة المساعد الذكي' : 'Consult Styling AI'}</span>
              </button>
            </motion.div>
          </div>

          {/* Image visual display card / Slider Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="lg:col-span-7 relative"
          >
            {/* Soft backdrop glow matching the image container */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 to-indigo-500/10 rounded-[2.5rem] blur-2xl -z-10" />

            {/* Floating Container overlapping downwards */}
            <motion.div
              className="relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_-15px_rgba(14,165,233,0.15)] border-4 border-white/80 lg:-mb-24 lg:translate-y-12 z-20 transition-transform duration-300 hover:scale-[1.01]"
            >
              {heroLayout === 'carousel' && images.length > 1 ? (
                <div className="relative w-full aspect-[4/3] sm:aspect-[1.4/1]">
                  {/* Slider Images with AnimatePresence for smooth transitions */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeIndex}
                      src={images[activeIndex]}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.6 }}
                      alt="ZEWKA Luxury Showcase"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  </AnimatePresence>

                  {/* Slider Arrows */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-105 z-30 flex items-center justify-center border border-white/10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-sm transition-all cursor-pointer hover:scale-105 z-30 flex items-center justify-center border border-white/10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 bg-slate-900/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          activeIndex === i ? 'bg-indigo-500 w-4' : 'bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] sm:aspect-[1.4/1]">
                  {/* The single static hero image */}
                  <img
                    src={images[0]}
                    alt="ZEWKA Boutique Interactive 3D Display"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Seamless glass-overlay card containing brand specs */}
                  <div className={`absolute bottom-6 ${isArabic ? 'right-6 text-right' : 'left-6 text-left'} max-w-xs bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl text-white`}>
                    <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase block mb-1">
                      {isArabic ? 'تصور ثلاثي الأبعاد تفاعلي' : 'INTERACTIVE CONCEPT'}
                    </span>
                    <h4 className="text-sm font-black mb-1.5 leading-tight">
                      {isArabic ? 'متجر زيوكا الفاخر والمعاصر' : 'ZEWKA Storefront Experience'}
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      {isArabic
                        ? 'تجربة تسوق رقمية غامرة تجمع بين الجمال الحسي وسهولة الاختيار والدفع بلمسات ذكية.'
                        : 'A beautifully integrated interface tailored for swift collection browsing, secure checkout, and personal tracking.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
