import React, { useState, useEffect, useRef } from 'react';
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
  heroBg4
}: HeroProps) {
  // Define premium luxury image pools for each of the 3 columns
  const col1Images = [
    heroBg || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop'
  ];

  const col2Images = [
    heroBg2 || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'
  ];

  const col3Images = [
    heroBg3 || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
    heroBg4 || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop'
  ];

  // Active slide state for each of the 3 columns
  const [idx1, setIdx1] = useState(0);
  const [idx2, setIdx2] = useState(0);
  const [idx3, setIdx3] = useState(0);

  // Auto-play interval for ambient movement
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx1((prev) => (prev + 1) % col1Images.length);
      // Stagger other columns slightly for organic fluid rhythm
      setTimeout(() => {
        setIdx2((prev) => (prev + 1) % col2Images.length);
      }, 1500);
      setTimeout(() => {
        setIdx3((prev) => (prev + 1) % col3Images.length);
      }, 3000);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Column titles and labels
  const colData = [
    {
      titleEn: 'Haute Couture',
      titleAr: 'الأزياء الراقية',
      images: col1Images,
      index: idx1,
      setIndex: setIdx1,
      id: 'col-1'
    },
    {
      titleEn: 'Signature Essentials',
      titleAr: 'القطع المميزة',
      images: col2Images,
      index: idx2,
      setIndex: setIdx2,
      id: 'col-2'
    },
    {
      titleEn: 'Bespoke Objects',
      titleAr: 'التصميم المبتكر',
      images: col3Images,
      index: idx3,
      setIndex: setIdx3,
      id: 'col-3'
    }
  ];

  // Mouse coordinate tracking for luxury cursor follower inside each column
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const colRefs = {
    'col-1': useRef<HTMLDivElement>(null),
    'col-2': useRef<HTMLDivElement>(null),
    'col-3': useRef<HTMLDivElement>(null)
  };

  const handleMouseMove = (colId: 'col-1' | 'col-2' | 'col-3', e: React.MouseEvent) => {
    const ref = colRefs[colId];
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Helper to switch slide left/right on click
  const handleColClick = (colId: string, index: number, setIndex: React.Dispatch<React.SetStateAction<number>>, imagesLength: number, e: React.MouseEvent) => {
    // If user clicked standard chevron/controls, don't trigger column wide click
    if ((e.target as HTMLElement).closest('.slide-control-btn')) return;

    const ref = colRefs[colId as 'col-1' | 'col-2' | 'col-3'];
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isRightSide = clickX > rect.width / 2;

      if (isArabic) {
        // Reverse direction for Arabic RTL
        if (isRightSide) {
          setIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
        } else {
          setIndex((prev) => (prev + 1) % imagesLength);
        }
      } else {
        if (isRightSide) {
          setIndex((prev) => (prev + 1) % imagesLength);
        } else {
          setIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
        }
      }
    }
  };

  return (
    <div 
      className="relative w-full h-[95vh] min-h-[680px] md:min-h-[820px] overflow-hidden bg-slate-950 text-white" 
      id="zewka-hero"
    >
      {/* 3 side-by-side rectangles with no separator */}
      <div className="grid grid-cols-3 h-full w-full gap-0">
        {colData.map((col) => {
          const isHovered = hoveredCol === col.id;
          const currentImage = col.images[col.index];

          return (
            <div
              key={col.id}
              ref={colRefs[col.id as 'col-1' | 'col-2' | 'col-3']}
              onMouseEnter={() => setHoveredCol(col.id)}
              onMouseLeave={() => setHoveredCol(null)}
              onMouseMove={(e) => handleMouseMove(col.id as 'col-1' | 'col-2' | 'col-3', e)}
              onClick={(e) => handleColClick(col.id, col.index, col.setIndex, col.images.length, e)}
              className="relative h-full w-full overflow-hidden select-none cursor-pointer group border-b md:border-b-0 border-white/5"
            >
              {/* Background Luxury Image with Smooth Animation */}
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={col.index}
                  src={currentImage}
                  initial={{ opacity: 0.6, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.5, scale: 0.98 }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  alt={isArabic ? col.titleAr : col.titleEn}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7] group-hover:brightness-[0.6] group-hover:scale-[1.03] transition-all duration-700"
                />
              </AnimatePresence>

              {/* Dynamic Vignette / Luxury Gradient Shadow */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />

              {/* Bottom Column Metadata Block */}
              <div 
                className={`absolute bottom-10 left-8 right-8 z-10 transition-all duration-500 transform ${
                  isHovered ? 'translate-y-[-8px]' : 'translate-y-0'
                }`}
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {/* Micro dots navigation inside column */}
                <div className="flex items-center justify-center md:justify-start gap-1.5 mt-4 slide-control-btn">
                  {col.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => col.setIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        col.index === i ? 'bg-[#C5A880] w-6' : 'bg-white/30 hover:bg-white/75 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Custom luxury cursor follower indicator on hover */}
              {isHovered && !isMobile() && (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-100 ease-out -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: mousePos.x,
                    top: mousePos.y
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 rounded-full w-24 h-24 shadow-2xl p-2 text-center"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase">
                      <span>{isArabic ? 'اضغط' : 'CLICK'}</span>
                    </div>
                    <span className="text-[9px] text-white font-bold opacity-80 mt-1">
                      {isArabic ? 'للتالي' : 'NEXT'}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-[#C5A880] mt-1 ${isArabic ? 'rotate-180' : ''}`} />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Glassmorphic floating card dead-center of the Hero */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto mx-4 w-full max-w-xl md:max-w-2xl text-center relative p-6 md:p-8"
          style={{ direction: isArabic ? 'rtl' : 'ltr' }}
        >
          {/* Champagne light flare */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#C5A880]/20 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#C5A880]/15 border border-[#C5A880]/25 text-[#C5A880] text-[10px] font-black rounded-full uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880] animate-pulse" />
            <span>{isArabic ? 'بوابة التسوق الحصرية' : 'ZEWKA SIGNATURE LUXURY'}</span>
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5 tracking-tight uppercase drop-shadow-md">
            {isArabic ? (
              heroTitleAr ? (
                <span className="bg-gradient-to-r from-white via-slate-100 to-[#C5A880] bg-clip-text text-transparent">{heroTitleAr}</span>
              ) : (
                <>
                  تسوّق نخبوّي<br />
                  <span className="bg-gradient-to-r from-[#C5A880] via-[#E5C8A0] to-white bg-clip-text text-transparent">يُعيد تعريف الفخامة</span>
                </>
              )
            ) : (
              heroTitle ? (
                <span className="bg-gradient-to-r from-white via-slate-100 to-[#C5A880] bg-clip-text text-transparent">{heroTitle}</span>
              ) : (
                <>
                  Elite Curation<br />
                  <span className="bg-gradient-to-r from-[#C5A880] via-[#E5C8A0] to-white bg-clip-text text-transparent">Redefining Luxury</span>
                </>
              )
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8 max-w-md mx-auto font-medium">
            {isArabic
              ? heroSubtitleAr || 'ندمج أرقى تصاميم الأزياء الحصرية، العطور الفريدة، والقطع الفنية النادرة مع تجربة تفاعلية ذكية ومخصصة بالكامل.'
              : heroSubtitle || 'Discover hand-selected collections of fine couture, bespoke fragrances, and limited-edition designer artifacts.'}
          </p>

          {/* Action buttons with Explore Shop in the center */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#C5A880] to-[#E5C8A0] hover:from-[#E5C8A0] hover:to-[#C5A880] rounded-2xl shadow-xl shadow-[#C5A880]/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isArabic ? 'استكشف المنتجات' : 'Explore Shop'}</span>
              <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''} text-slate-950`} />
            </button>

            <button
              onClick={onAiClick}
              className="w-full sm:w-auto px-7 py-4 text-xs font-black uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]/20 animate-pulse" />
              <span>{isArabic ? 'مستشار المظهر الذكي' : 'Consult Styling AI'}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Thin elegant gold top and bottom glow lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C5A880]/30 to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C5A880]/30 to-transparent z-10" />
    </div>
  );
}

// Simple helper to detect mobile screens
function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}
