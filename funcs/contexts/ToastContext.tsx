/**
 * Toast Context Provider
 * 
 * Provides global toast notification functionality throughout the application.
 */

'use client'

import React, { createContext, useContext } from 'react'
import { useToast } from '../../components/Toast'
import type { ToastMessage } from '../../components/Toast'

interface ToastContextType {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
  info: (title: string, message?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  
  return context
}

// Export the context for testing purposes
export { ToastContext }
