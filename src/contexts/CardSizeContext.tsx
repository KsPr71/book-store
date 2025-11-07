"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CardSizeContextType {
  cardSize: number;
  setCardSize: (size: number) => void;
}

const CardSizeContext = createContext<CardSizeContextType | undefined>(undefined);

export function CardSizeProvider({ children }: { children: ReactNode }) {
  const [cardSize, setCardSizeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('book-card-size');
      return saved ? parseFloat(saved) : 22;
    }
    return 22;
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('book-card-size', cardSize.toString());
    }
  }, [cardSize]);

  const setCardSize = (size: number) => {
    setCardSizeState(size);
  };

  return (
    <CardSizeContext.Provider value={{ cardSize, setCardSize }}>
      {children}
    </CardSizeContext.Provider>
  );
}

export function useCardSize() {
  const context = useContext(CardSizeContext);
  if (context === undefined) {
    throw new Error('useCardSize must be used within a CardSizeProvider');
  }
  return context;
}

