'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Clock, Star } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import Button from '../Button';
import Card from '../Card';

interface BannerProps {
  onOrderNow?: () => void;
}

export default function Banner({ onOrderNow }: BannerProps) {
  return (
    <section className={cn(
      'relative overflow-hidden',
      theme.background.primary,
      'py-8 md:py-16'
    )}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
      
      <div className={cn(responsive.container.xl, 'px-4 relative z-10')}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            {...animations.slideIn}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <span>🔥</span>
              <span>Free delivery for orders over $30</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'font-bold leading-tight mb-6',
                'text-4xl md:text-5xl lg:text-6xl',
                theme.text.primary
              )}
            >
              Delicious Food
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Delivered Fast
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                'mb-8 max-w-lg mx-auto lg:mx-0',
                responsive.fontSize.lg,
                theme.text.secondary
              )}
            >
              Order from your favorite restaurants and get fresh, hot food delivered to your doorstep in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                onClick={onOrderNow}
                variant="accent"
                size="lg"
                className="group"
              >
                Order Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
              >
                View Menu
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center lg:justify-start space-x-8 mt-8"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <div className={cn('font-bold', theme.text.primary)}>30 min</div>
                  <div className={cn('text-xs', theme.text.secondary)}>Delivery</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <div className="text-left">
                  <div className={cn('font-bold', theme.text.primary)}>4.9</div>
                  <div className={cn('text-xs', theme.text.secondary)}>Rating</div>
                </div>
              </div>
              
              <div className="text-left">
                <div className={cn('font-bold', theme.text.primary)}>1000+</div>
                <div className={cn('text-xs', theme.text.secondary)}>Orders</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image/Food Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            {/* Main Food Card */}
            <Card
              hoverable
              className="max-w-sm mx-auto lg:max-w-none transform rotate-3 hover:rotate-0 transition-transform duration-500"
            >
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <div className="text-6xl">🍕</div>
              </div>
              <h3 className={cn('font-bold mb-2', responsive.fontSize.lg, theme.text.primary)}>
                Margherita Pizza
              </h3>
              <p className={cn('mb-4', theme.text.secondary)}>
                Fresh tomatoes, mozzarella, and basil
              </p>
              <div className="flex items-center justify-between">
                <span className={cn('font-bold text-xl', 'text-orange-500')}>
                  $18.99
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className={cn('text-sm font-medium', theme.text.primary)}>4.8</span>
                </div>
              </div>
            </Card>

            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-4 -left-4 hidden lg:block"
            >
              <Card className="w-20 h-20 flex items-center justify-center">
                <span className="text-2xl">🍔</span>
              </Card>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 1 }}
              className="absolute -bottom-4 -right-4 hidden lg:block"
            >
              <Card className="w-20 h-20 flex items-center justify-center">
                <span className="text-2xl">🍜</span>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
