import type { ReactNode } from 'react'
import { createContext, use, useCallback, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface GlobalAlertContextType {
  showAlert: (title: string, message: string) => Promise<void>
  showConfirm: (title: string, message: string) => Promise<boolean>
}

const GlobalAlertContext = createContext<GlobalAlertContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalAlert() {
  const context = use(GlobalAlertContext)
  if (!context) {
    throw new Error('useGlobalAlert must be used within a GlobalAlertProvider')
  }
  return context
}

export function GlobalAlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({ title: '', message: '', type: 'alert' as 'alert' | 'confirm' })
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null)

  const showAlert = useCallback((title: string, message: string) => {
    setConfig({ title, message, type: 'alert' })
    setIsOpen(true)
    return new Promise<void>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const showConfirm = useCallback((title: string, message: string) => {
    setConfig({ title, message, type: 'confirm' })
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleClose = (result: boolean) => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(result)
      setResolvePromise(null)
    }
  }

  const contextValue = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm])

  return (
    <GlobalAlertContext value={contextValue}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={open => !open && handleClose(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {config.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {config.type === 'confirm' && (
              <AlertDialogCancel onClick={() => handleClose(false)}>Abbrechen</AlertDialogCancel>
            )}
            <AlertDialogAction onClick={() => handleClose(true)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlobalAlertContext>
  )
}
