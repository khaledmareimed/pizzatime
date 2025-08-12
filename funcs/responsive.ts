// Responsive utility functions for mobile-first design
export const responsive = {
  // Font sizes that scale across devices
  fontSize: {
    xs: 'text-xs md:text-sm',
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl',
    '2xl': 'text-2xl md:text-3xl',
    '3xl': 'text-3xl md:text-4xl',
    '4xl': 'text-4xl md:text-5xl',
  },
  
  // Spacing that adapts to screen size
  spacing: {
    xs: 'p-2 md:p-3',
    sm: 'p-3 md:p-4',
    base: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-12',
  },
  
  // Container widths
  container: {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-4xl mx-auto',
    xl: 'max-w-6xl mx-auto',
    full: 'max-w-7xl mx-auto',
  },
  
  // Grid layouts
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-1 md:grid-cols-2',
    desktop: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    full: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }
};

// Theme utility for Apple-like design
export const theme = {
  colors: {
    primary: {
      light: 'bg-blue-500 hover:bg-blue-600',
      dark: 'dark:bg-blue-600 dark:hover:bg-blue-700'
    },
    secondary: {
      light: 'bg-gray-100 hover:bg-gray-200',
      dark: 'dark:bg-gray-800 dark:hover:bg-gray-700'
    },
    accent: {
      light: 'bg-orange-500 hover:bg-orange-600',
      dark: 'dark:bg-orange-600 dark:hover:bg-orange-700'
    }
  },
  
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    card: 'bg-white dark:bg-gray-800',
    accent: 'bg-blue-100 dark:bg-blue-900'
  },
  
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-100 dark:border-gray-800'
  },
  
  shadow: {
    card: 'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
    button: 'shadow-md shadow-gray-200/30 dark:shadow-gray-900/30'
  }
};

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  }
};
