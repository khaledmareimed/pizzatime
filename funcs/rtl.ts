/**
 * RTL (Right-to-Left) utility functions
 */

export const RTL_LANGUAGES = [
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian/Farsi
  'ur', // Urdu
  'ku', // Kurdish
  'ps', // Pashto
  'sd', // Sindhi
  'yi', // Yiddish
];

/**
 * Check if the current language is RTL
 */
export const isRTL = (locale?: string): boolean => {
  if (typeof window !== 'undefined') {
    const documentDir = document.documentElement.dir;
    if (documentDir) {
      return documentDir === 'rtl';
    }
  }
  
  const lang = locale || (typeof window !== 'undefined' ? window.navigator.language : 'en');
  const primaryLanguage = lang.split('-')[0].toLowerCase();
  return RTL_LANGUAGES.includes(primaryLanguage);
};

/**
 * Get direction class for Tailwind CSS
 */
export const getDirectionClass = (locale?: string): string => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

/**
 * Get text alignment for RTL/LTR
 */
export const getTextAlign = (locale?: string): 'left' | 'right' => {
  return isRTL(locale) ? 'right' : 'left';
};

/**
 * Get margin class for RTL support
 */
export const getMarginClass = (side: 'left' | 'right', value: string, locale?: string): string => {
  const rtl = isRTL(locale);
  
  if (side === 'left') {
    return rtl ? `mr-${value}` : `ml-${value}`;
  } else {
    return rtl ? `ml-${value}` : `mr-${value}`;
  }
};

/**
 * Get padding class for RTL support
 */
export const getPaddingClass = (side: 'left' | 'right', value: string, locale?: string): string => {
  const rtl = isRTL(locale);
  
  if (side === 'left') {
    return rtl ? `pr-${value}` : `pl-${value}`;
  } else {
    return rtl ? `pl-${value}` : `pr-${value}`;
  }
};

/**
 * Get flex direction for RTL support
 */
export const getFlexDirection = (direction: 'row' | 'row-reverse', locale?: string): string => {
  const rtl = isRTL(locale);
  
  if (direction === 'row') {
    return rtl ? 'flex-row-reverse' : 'flex-row';
  } else {
    return rtl ? 'flex-row' : 'flex-row-reverse';
  }
};

/**
 * Transform coordinates for RTL layout
 */
export const transformX = (x: number, containerWidth: number, locale?: string): number => {
  const rtl = isRTL(locale);
  return rtl ? containerWidth - x : x;
};

/**
 * Get border radius for RTL support
 */
export const getBorderRadius = (
  corner: 'tl' | 'tr' | 'bl' | 'br',
  value: string,
  locale?: string
): string => {
  const rtl = isRTL(locale);
  
  if (!rtl) {
    switch (corner) {
      case 'tl': return `rounded-tl-${value}`;
      case 'tr': return `rounded-tr-${value}`;
      case 'bl': return `rounded-bl-${value}`;
      case 'br': return `rounded-br-${value}`;
    }
  } else {
    switch (corner) {
      case 'tl': return `rounded-tr-${value}`;
      case 'tr': return `rounded-tl-${value}`;
      case 'bl': return `rounded-br-${value}`;
      case 'br': return `rounded-bl-${value}`;
    }
  }
};

/**
 * RTL-aware CSS class concatenation
 */
export const rtlClass = (baseClass: string, rtlClass?: string, locale?: string): string => {
  const rtl = isRTL(locale);
  return rtl && rtlClass ? `${baseClass} ${rtlClass}` : baseClass;
};
