'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { useBanners } from '../../funcs/hooks/useBanners';
import { Banner } from '../../funcs/collections/settings';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaAction?: () => void;
  backgroundColor: string;
  linkUrl?: string | null;
}

// Fallback banners in case no banners are loaded from settings
const fallbackBannerSlides: BannerSlide[] = [
  {
    id: 'fallback-1',
    image: '🍕',
    title: 'بيتزا طازجة يومياً',
    subtitle: 'مصنوعة من مكونات إيطالية أصلية',
    ctaText: 'اطلب الآن',
    backgroundColor: 'from-orange-500 to-red-500'
  },
  {
    id: 'fallback-2',
    image: '🍔',
    title: 'جورميه برجر',
    subtitle: 'برجر لذيذ مع مكونات مميزة',
    ctaText: 'جرب اليوم',
    backgroundColor: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'fallback-3',
    image: '🍜',
    title: 'آسيوي طعام',
    subtitle: 'نسمات أصلية من جميع أنحاء آسيا',
    ctaText: 'استكشف القائمة',
    backgroundColor: 'from-green-500 to-teal-500'
  }
];

// Convert Banner from settings to BannerSlide format
const convertBannerToSlide = (banner: Banner, index: number): BannerSlide => {
  const gradients = [
    'from-orange-500 to-red-500',
    'from-yellow-500 to-orange-500', 
    'from-green-500 to-teal-500',
    'from-blue-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-red-500 to-orange-500'
  ];

  return {
    id: banner._id || `banner-${index}`,
    image: banner.imageUrl,
    title: banner.title,
    subtitle: banner.description || '',
    ctaText: banner.linkUrl ? 'اعرف المزيد' : 'اطلب الآن',
    backgroundColor: gradients[index % gradients.length],
    linkUrl: banner.linkUrl
  };
};

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
  
  // Fetch banners from settings
  const { banners, loading, error } = useBanners();
  
  // Convert banners to slides or use fallback
  const bannerSlides = banners.length > 0 
    ? banners.map((banner, index) => convertBannerToSlide(banner, index))
    : fallbackBannerSlides;

  // Auto-slide functionality
  useEffect(() => {
    if (isPlaying && bannerSlides.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      }, autoSlideInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoSlideInterval, bannerSlides.length]);

  // Reset current slide if banners change
  useEffect(() => {
    if (currentSlide >= bannerSlides.length) {
      setCurrentSlide(0);
    }
  }, [bannerSlides.length, currentSlide]);

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

  const handleSlideAction = (slide: BannerSlide) => {
    if (slide.linkUrl) {
      // Open external link in new tab
      window.open(slide.linkUrl, '_blank', 'noopener,noreferrer');
    } else if (onSlideAction) {
      // Call custom action
      onSlideAction(slide);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
          'flex items-center justify-center'
        )}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={cn('text-lg', theme.text.secondary)}>جاري تحميل البانرات...</p>
          </div>
        </div>
      </section>
    );
  }

  // Show error state with fallback
  if (error && bannerSlides.length === 0) {
    return (
      <section className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20',
          'flex items-center justify-center'
        )}>
          <div className="text-center">
            <p className={cn('text-lg mb-2', theme.text.primary)}>خطأ في تحميل البانرات</p>
            <p className={cn('text-sm', theme.text.secondary)}>سيتم استخدام البانرات الافتراضية</p>
          </div>
        </div>
      </section>
    );
  }

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
          
          {/* Banner Image Background */}
          {currentBanner.image.startsWith('http') && (
            <motion.div
              key={`bg-image-${currentSlide}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Hide image if it fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Darker overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40" />
            </motion.div>
          )}

          {/* Content */}
          <div className={cn(responsive.container.xl, 'px-4 h-full relative z-10')}>
            <div className="flex items-center justify-between h-full">
              {/* Left Content - Text */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-lg text-center md:text-left"
              >
                <div className="text-white">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                      'font-bold mb-4',
                      'text-3xl md:text-4xl lg:text-5xl'
                    )}
                  >
                    {currentBanner.title}
                  </motion.h2>
                  
                  {currentBanner.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={cn(
                        'mb-8 text-white/90',
                        'text-lg md:text-xl'
                      )}
                    >
                      {currentBanner.subtitle}
                    </motion.p>
                  )}
                  
                  {currentBanner.ctaText && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSlideAction(currentBanner)}
                      className={cn(
                        'px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl',
                        'hover:bg-gray-100 transition-colors duration-200',
                        'shadow-lg hover:shadow-xl text-lg'
                      )}
                    >
                      {currentBanner.ctaText}
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* Right Content - Featured Image (only for non-background images) */}
              {!currentBanner.image.startsWith('http') && (
                <motion.div
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="hidden lg:block"
                >
                  <div className="text-8xl xl:text-9xl">
                    {currentBanner.image}
                  </div>
                </motion.div>
              )}
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
