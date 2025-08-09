'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaAction?: () => void;
  backgroundColor: string;
}

const bannerSlides: BannerSlide[] = [
  {
    id: '1',
    image: '🍕',
    title: 'بيتزا طازجة يومياً',
    subtitle: 'مصنوعة من مكونات إيطالية أصلية',
    ctaText: 'اطلب الآن',
    backgroundColor: 'from-orange-500 to-red-500'
  },
  {
    id: '2',
    image: '🍔',
    title: 'جورميه برجر',
    subtitle: 'برجر لذيذ مع مكونات مميزة',
    ctaText: 'جرب اليوم',
    backgroundColor: 'from-yellow-500 to-orange-500'
  },
  {
    id: '3',
    image: '🍜',
    title: 'آسيوي طعام',
    subtitle: 'نسمات أصلية من جميع أنحاء آسيا',
    ctaText: 'استكشف القائمة',
    backgroundColor: 'from-green-500 to-teal-500'
  },
  {
    id: '4',
    image: '🥗',
    title: 'خيارات صحية',
    subtitle: 'سلطات طازجة ووجبات مغذية',
    ctaText: 'تناول طعام صحي',
    backgroundColor: 'from-green-400 to-blue-500'
  }
];

interface ImageBannerProps {
  autoSlideInterval?: number;
  onSlideAction?: (slide: BannerSlide) => void;
}

export default function ImageBanner({ 
  autoSlideInterval = 10000,
  onSlideAction 
}: ImageBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      }, autoSlideInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoSlideInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentBanner = bannerSlides[currentSlide];

  return (
    <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className={cn(
            'absolute inset-0 bg-gradient-to-r',
            currentBanner.backgroundColor
          )}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Content */}
          <div className={cn(responsive.container.xl, 'px-4 h-full relative z-10')}>
            <div className="flex items-center justify-start h-full">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-md text-center md:text-left"
              >
                <div className="text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-6xl md:text-8xl mb-4"
                  >
                    {currentBanner.image}
                  </motion.div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                      'font-bold mb-2',
                      'text-2xl md:text-3xl lg:text-4xl'
                    )}
                  >
                    {currentBanner.title}
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={cn(
                      'mb-6 text-white/90',
                      responsive.fontSize.lg
                    )}
                  >
                    {currentBanner.subtitle}
                  </motion.p>
                  
                  {currentBanner.ctaText && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSlideAction?.(currentBanner)}
                      className={cn(
                        'px-8 py-3 bg-white text-gray-900 font-semibold rounded-2xl',
                        'hover:bg-gray-100 transition-colors duration-200',
                        'shadow-lg hover:shadow-xl'
                      )}
                    >
                      {currentBanner.ctaText}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        {/* Next Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNext}
          className={cn(
            'pointer-events-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm',
            'flex items-center justify-center text-white hover:bg-white/30',
            'transition-all duration-200 border border-white/20'
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {/* Previous Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevious}
          className={cn(
            'pointer-events-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm',
            'flex items-center justify-center text-white hover:bg-white/30',
            'transition-all duration-200 border border-white/20'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-0 right-0">
        <div className={cn(responsive.container.xl, 'px-4')}>
          <div className="flex items-center justify-between">
            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {bannerSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all duration-200',
                    index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  )}
                />
              ))}
            </div>

            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlayPause}
              className={cn(
                'w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm',
                'flex items-center justify-center text-white hover:bg-white/30',
                'transition-all duration-200 border border-white/20'
              )}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: autoSlideInterval / 1000,
            ease: "linear",
            repeat: isPlaying ? Infinity : 0
          }}
          key={`${currentSlide}-${isPlaying}`}
        />
      </div>
    </section>
  );
}
