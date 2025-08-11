'use client'

import { useToastContext } from '@/funcs/contexts/ToastContext'
import { ToastContainer } from '@/components/Toast'

export default function ToastWrapper() {
  const { toasts, removeToast } = useToastContext()
  
  return <ToastContainer toasts={toasts} onClose={removeToast} />
}