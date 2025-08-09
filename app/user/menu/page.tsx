'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Plus } from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import { formatPrice, type FoodItem } from '../../../funcs/utils';
import Card from '../../../components/Card';
import Button from '../../../components/Button';

const menuCategories = [
  'جميع الأصناف',
  'بيتزا',
  'البرجر', 
  
  'سلطات',
  'حلويات',
  'مشروبات',
  'مقبلات'
];

const menuItems: FoodItem[] = [
  // Pizza
  {
    id: '1',
    name: 'بيتزا مارغريتا',
    description: 'طماطم طازجة، موتزاريلا، وريحان على العجين التقليدي',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=400&fit=crop',
    category: 'بيتزا',
    rating: 4.8,
    prepTime: '20-25 min',
    isPopular: true,
    isVegetarian: true
  },
  {
    id: '2',
    name: 'بيتزا بيبروني',
    description: 'بيبروني كلاسيكي مع جبنة موتزاريلا وصلصة الطماطم',
    price: 21.99,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=400&fit=crop',
    category: 'بيتزا',
    rating: 4.7,
    prepTime: '20-25 min',
    isPopular: true
  },
  {
    id: '3',
    name: 'بيتزا سوبريم',
    description: 'بيبروني، سجق، فليفلة، بصل، وفطر',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
    category: 'بيتزا',
    rating: 4.9,
    prepTime: '25-30 min'
  },
  // Burgers
  {
    id: '4',
    name: 'برجر كلاسيك',
    description: 'لحم بقر، خس، طماطم، مخللات، وصوص خاص',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    category: 'برجر',
    rating: 4.6,
    prepTime: '15-20 min',
    isPopular: true
  },
  {
    id: '5',
    name: 'برجر بيكون تشيز',
    description: 'شريحتين لحم بقر مع بيكون، جبنة، وبصل مقرمش',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop',
    category: 'برجر',
    rating: 4.8,
    prepTime: '18-22 min'
  },
  {
    id: '6',
    name: 'برجر نباتي',
    description: 'فطيرة نباتية مع أفوكادو، براعم، وصوص طحينة',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400&h=400&fit=crop',
    category: 'برجر',
    rating: 4.5,
    prepTime: '15-20 min',
    isVegetarian: true
  },
  
  // Salads
  {
    id: '9',
    name: 'سلطة سيزر',
    description: 'خس روماني مقرمش، بارميزان، خبز محمص، وصوص سيزر',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
    category: 'سلطات',
    rating: 4.4,
    prepTime: '10-15 min',
    isVegetarian: true
  },
  {
    id: '10',
    name: 'سلطة يونانية',
    description: 'خضار مشكلة، زيتون، فيتا، طماطم، وزيت زيتون',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
    category: 'سلطات',
    rating: 4.6,
    prepTime: '10-15 min',
    isVegetarian: true
  },
  // Desserts
  {
    id: '11',
    name: 'كيكة الشوكولاتة',
    description: 'كيكة طبقات غنية بالشوكولاتة مع كريمة جاناش',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    category: 'حلويات',
    rating: 4.8,
    prepTime: '5-10 min',
    isVegetarian: true
  },
  {
    id: '12',
    name: 'تشيز كيك',
    description: 'تشيز كيك على الطريقة نيويوركية مع كومبوت التوت',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=400&fit=crop',
    category: 'حلويات',
    rating: 4.7,
    prepTime: '5-10 min',
    isVegetarian: true
  },
  // Drinks
  {
    id: '13',
    name: 'سموذي فواكه',
    description: 'تشكيلة من التوت، الموز، والزبادي',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=400&fit=crop',
    category: 'مشروبات',
    rating: 4.5,
    prepTime: '5 min',
    isVegetarian: true
  },
  {
    id: '14',
    name: 'قهوة مثلجة',
    description: 'قهوة باردة مع الحليب وشراب الفانيليا',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
    category: 'مشروبات',
    rating: 4.3,
    prepTime: '3-5 min',
    isVegetarian: true
  },
  // Appetizers
  {
    id: '15',
    name: 'أجنحة بافلو',
    description: 'أجنحة دجاج مقرمشة مغطاة بصوص بافلو الحار',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop',
    category: 'مقبلات',
    rating: 4.6,
    prepTime: '15-20 min',
    isSpicy: true
  },
  {
    id: '16',
    name: 'عصا الموتزاريلا',
    description: 'عصا الموتزاريلا المقلية مع صلصة المارينارا',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=400&fit=crop',
    category: 'مقبلات',
    rating: 4.4,
    prepTime: '10-15 min',
    isVegetarian: true
  }
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Items');

  const filteredItems = menuItems.filter(item => {
    return selectedCategory === 'All Items' || item.category === selectedCategory;
  });

  const handleAddToCart = (item: FoodItem) => {
    console.log(`Added ${item.name} to cart`);
    // Add to cart logic here
  };

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Page Header */}
      <section className={cn('py-8 md:py-12', theme.background.secondary)}>
        <div className={cn(responsive.container.xl, 'px-4')}>
          <motion.div
            {...animations.fadeIn}
            className="text-center"
          >
            <h1 className={cn(
              'font-bold mb-4',
              'text-3xl md:text-4xl lg:text-5xl',
              theme.text.primary
            )}>
              قائمة <span className="text-orange-500">الطعام</span>
            </h1>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
اكتشف مجموعتنا اللذيذة من الأطباق الطازجة            </p>
          </motion.div>
        </div>
      </section>

      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex overflow-x-auto pb-2 mb-8 gap-2 md:justify-center"
        >
          {menuCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all duration-200',
                selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-lg'
                  : cn(
                      theme.colors.secondary.light,
                      theme.colors.secondary.dark,
                      theme.text.primary,
                      'hover:shadow-md'
                    )
              )}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <p className={cn('text-sm', theme.text.secondary)}>
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            {selectedCategory !== 'جميع الأصناف' && ` in ${selectedCategory}`}
          </p>
        </motion.div>

        {/* Menu Items Grid */}
        <div className={cn(
          'grid gap-6',
          responsive.grid.desktop
        )}>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                hoverable
                className="relative overflow-hidden group h-full"
              >
                {/* Popular Badge */}
                {item.isPopular && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}

                {/* Food Image */}
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1 flex flex-col">
                  <div>
                    <h3 className={cn(
                      'font-bold mb-2',
                      responsive.fontSize.lg,
                      theme.text.primary
                    )}>
                      {item.name}
                    </h3>
                    
                    <p className={cn(
                      'line-clamp-2 mb-3',
                      responsive.fontSize.sm,
                      theme.text.secondary
                    )}>
                      {item.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-3">
                    {item.isVegetarian && (
                      <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                        🌱 Vegetarian
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                        🌶️ Spicy
                      </span>
                    )}
                  </div>

                  {/* Rating and Prep Time */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className={cn(
                        'text-sm font-medium',
                        theme.text.primary
                      )}>
                        {item.rating}
                      </span>
                      <span className={cn('text-xs', theme.text.secondary)}>
                        ({Math.floor(Math.random() * 200) + 50} reviews)
                      </span>
                    </div>

                    <span className={cn('text-sm', theme.text.secondary)}>
                      {item.prepTime}
                    </span>
                  </div>

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <span className={cn(
                      'font-bold text-xl',
                      'text-orange-500'
                    )}>
                      {formatPrice(item.price)}
                    </span>

                    <Button
                      onClick={() => handleAddToCart(item)}
                      variant="accent"
                      size="sm"
                      className="group"
                    >
                      <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className={cn(
              'font-bold mb-2',
              responsive.fontSize.lg,
              theme.text.primary
            )}>
لم يتم العثور على عناصر            </h3>
            <p className={cn(theme.text.secondary)}>
حاول تحديد فئة مختلفة            </p>
            <Button
              onClick={() => {
                setSelectedCategory('جميع الأصناف');
              }}
              variant="outline"
              className="mt-4"
            >
إظهار جميع العناصر            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
