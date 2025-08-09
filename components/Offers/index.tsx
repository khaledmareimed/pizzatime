'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Percent, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import Card from '../Card';
import Button from '../Button';
import type { OfferItem } from '../../funcs/utils';

const offers: OfferItem[] = [
  {
    id: '1',
    title: 'عرض العائلة المميز',
    description: '٢ بيتزا كبيرة + ٢ مشروب + حلى',
    discount: '١٤٩ ريال',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&crop=center',
    validUntil: '2025-12-31',
    code: 'FAMILY39'
  },
  {
    id: '2',
    title: 'وجبة البرجر الشاملة',
    description: 'برجر لحم + بطاطس مقلية + مشروب',
    discount: '٤٩ ريال',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
    validUntil: '2025-12-31',
    code: 'BURGER12'
  },
  {
    id: '3',
    title: 'عرض الغداء الخاص',
    description: 'أي طبق رئيسي + طبق جانبي + مشروب',
    discount: '٥٩ ريال',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center',
    validUntil: '2025-12-31',
    code: 'LUNCH15'
  },
  {
    id: '4',
    title: 'فطور نهاية الأسبوع',
    description: 'بان كيك + قهوة + عصير طازج',
    discount: '٦٩ ريال',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center',
    validUntil: '2025-12-31',
    code: 'BRUNCH18'
  }
];

interface OffersProps {
  onClaimOffer?: (offer: OfferItem) => void;
}

export default function Offers({ onClaimOffer }: OffersProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };
  return (
    <section className={cn(
      'py-12 md:py-20',
      theme.background.secondary
    )}>
      <div className={cn(responsive.container.xl, 'px-4')}>
        {/* Section Header */}
        <motion.div
          {...animations.fadeIn}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Gift className="w-4 h-4" />
            <span>عروض الوجبات</span>
          </div>
          
          <p className={cn(
            'font-bold mb-4',
            'text-3xl md:text-4xl lg:text-5xl',
            'text-black-500'
          )}>
            عروض الوجبات
          </p>
            <p className={cn(
            'font-bold mb-4',
            'text-3xl md:text-4xl lg:text-5xl',
            'text-orange-500'
          )}>
            الحالية
          </p>
          
          <p className={cn(
            'max-w-2xl mx-auto',
            responsive.fontSize.lg,
            theme.text.secondary
          )}>
وفر الكثير مع مجموعات وصفقات الوجبات المنسقة خصيصا!          </p>
        </motion.div>

        {/* Offers Slider */}
        <div className="relative">
          {/* Navigation Arrows - Desktop only */}
          <button
            onClick={scrollLeft}
            className={cn(
              'hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 items-center justify-center rounded-full',
              theme.background.card,
              theme.border.primary,
              'border shadow-lg hover:shadow-xl transition-all duration-200',
              'hover:scale-105 -ml-6'
            )}
          >
            <ChevronLeft className={cn('w-6 h-6', theme.text.primary)} />
          </button>
          
          <button
            onClick={scrollRight}
            className={cn(
              'hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 items-center justify-center rounded-full',
              theme.background.card,
              theme.border.primary,
              'border shadow-lg hover:shadow-xl transition-all duration-200',
              'hover:scale-105 -mr-6'
            )}
          >
            <ChevronRight className={cn('w-6 h-6', theme.text.primary)} />
          </button>

          <div 
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x snap-mandatory"
          >
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-none w-72 md:w-80 snap-start"
              >
                <Card
                  hoverable
                  className="relative overflow-hidden group h-full"
                >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-600/20 dark:to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img 
                        src={offer.image} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold',
                      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    )}>
                      {offer.discount}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className={cn(
                    'font-bold mb-2',
                    responsive.fontSize.xl,
                    theme.text.primary
                  )}>
                    {offer.title}
                  </h3>
                  
                  <p className={cn(
                    'mb-6',
                    responsive.fontSize.base,
                    theme.text.secondary
                  )}>
                    {offer.description}
                  </p>

                  {/* Action Button */}
                  <Button
                    onClick={() => onClaimOffer?.(offer)}
                    variant="accent"
                    fullWidth
                    className="group"
                  >
                    اطلب العرض
                    <Percent className="mr-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
          </div>
        </div>

        {/* View All Offers */}
      
      </div>
    </section>
  );
}
