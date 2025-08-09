'use client';

import { createContext, useContext, useRef, ReactNode } from 'react';

interface SearchContextType {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <SearchContext.Provider value={{ searchInputRef, focusSearch }}>
      {children}
    </SearchContext.Provider>
  );
}
