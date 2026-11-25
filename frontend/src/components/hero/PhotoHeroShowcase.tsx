import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Armchair, ArrowRight } from 'lucide-react';

/**
 * Editorial photo hero: real restaurant photography with a slow crossfade and gentle
 * Ken Burns zoom. Images are self-hosted in /public/images/hero (Pexels & Unsplash licence,
 * free for commercial use).
 */
interface Slide {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  caption: string;
  credit: string;
  /** CSS object-position to keep the subject in frame on narrow screens */
  focus?: string;
}

const SLIDES: Slide[] = [
  {
    src: '/images/hero/waiter-serving.jpg',
    alt: 'Waiter presenting a burger and a fresh drink on a serving tray',
    eyebrow: 'Table service',
    title: 'Served the moment it’s ready',
    caption: 'Your order goes straight to the kitchen, and your server brings it to your table.',
    credit: 'Anil Sharma / Pexels',
    focus: '60% 40%',
  },
  {
    src: '/images/hero/burger-coke.jpg',
    alt: 'Gourmet burgers on a wooden board with bottles of Coca-Cola',
    eyebrow: 'Chef’s signature',
    title: 'Handcrafted burgers',
    caption: 'Freshly grilled to order and paired with ice-cold Coca-Cola.',
    credit: 'Unsplash',
    focus: '45% 55%',
  },
  {
    src: '/images/hero/coke-ice.jpg',
    alt: 'Cans of Coca-Cola on crushed ice',
    eyebrow: 'Beverages',
    title: 'Ice-cold refreshments',
    caption: 'Chilled soft drinks, lassis and mocktails to go with every meal.',
    credit: 'Unsplash',
    focus: '40% 50%',
  },
  {
    src: '/images/hero/table-service.jpg',
    alt: 'Plated dish served at a candlelit restaurant table',
    eyebrow: 'Dine in',
    title: 'Fine dining, without the wait',
    caption: 'Browse the menu, order and pay from your phone. No flagging down staff.',
    credit: 'Unsplash',
  },
  {
    src: '/images/hero/dining-room.jpg',
    alt: 'Warmly lit restaurant dining room with set tables',
    eyebrow: 'Our dining room',
    title: 'A table is ready for you',
    caption: 'Scan the QR code on your table, or let us seat you at the next free one.',
    credit: 'Unsplash',
  },
];

const SLIDE_MS = 6500;

interface PhotoHeroShowcaseProps {
  onExploreHall?: () => void;
  onInstantDemo?: () => void;
  className?: string;
}

export const PhotoHeroShowcase: React.FC<PhotoHeroShowcaseProps> = ({ onExploreHall, onInstantDemo, className = '' }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = SLIDES[index];

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  // Preload the next photo so crossfades never flash
  useEffect(() => {
    const img = new Image();
    img.src = SLIDES[(index + 1) % SLIDES.length].src;
  }, [index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Restaurant highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`group relative w-full h-[340px] sm:h-[420px] lg:h-[560px] rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Photo layer */}
      <AnimatePresence initial={false}>
        <motion.img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: slide.focus || 'center' }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.1, ease: 'easeInOut' }, scale: { duration: SLIDE_MS / 1000 + 1.2, ease: 'linear' } }}
        />
      </AnimatePresence>

      {/* Legibility gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

      {/* Progress segments */}
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-10">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${s.title}`}
            className="relative flex-1 h-1 rounded-full bg-white/25 overflow-hidden"
          >
            {i < index && <span className="absolute inset-0 bg-white/90" />}
            {i === index && (
              <motion.span
                key={`${index}-${paused}`}
                className="absolute inset-y-0 left-0 bg-white"
                initial={{ width: paused ? '100%' : '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Prev / next (appear on hover) */}
      {[
        { d: -1, Icon: ChevronLeft, pos: 'left-3', label: 'Previous slide' },
        { d: 1, Icon: ChevronRight, pos: 'right-3', label: 'Next slide' },
      ].map(({ d, Icon, pos, label }) => (
        <button
          key={label}
          onClick={() => go(d)}
          aria-label={label}
          className={`absolute ${pos} top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur border border-white/15 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
        >
          <Icon size={18} />
        </button>
      ))}

      {/* Caption + actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="max-w-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">{slide.eyebrow}</p>
            <h3 className="mt-1.5 text-xl sm:text-2xl lg:text-[28px] font-bold text-white leading-tight tracking-tight">
              {slide.title}
            </h3>
            <p className="mt-2 text-sm text-white/75 leading-relaxed">{slide.caption}</p>
          </motion.div>
        </AnimatePresence>

        {(onInstantDemo || onExploreHall) && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {onInstantDemo && (
              <button
                onClick={onInstantDemo}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-900 text-sm font-semibold hover:bg-amber-50 active:scale-[0.98] transition"
              >
                Get seated <ArrowRight size={16} />
              </button>
            )}
            {onExploreHall && (
              <button
                onClick={onExploreHall}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur text-white text-sm font-semibold active:scale-[0.98] transition"
              >
                <Armchair size={16} /> View tables
              </button>
            )}
          </div>
        )}
      </div>

      <span className="absolute bottom-2 right-3 z-10 text-[9px] text-white/40">Photo: {slide.credit}</span>
    </section>
  );
};

export default PhotoHeroShowcase;
