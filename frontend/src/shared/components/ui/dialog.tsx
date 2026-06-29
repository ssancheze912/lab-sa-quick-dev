import { type ReactNode, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (open) {
      root.setAttribute('aria-hidden', 'true')
      root.style.visibility = 'hidden'
    } else {
      root.removeAttribute('aria-hidden')
      root.style.visibility = ''
    }
    return () => {
      root.removeAttribute('aria-hidden')
      root.style.visibility = ''
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false)
        return
      }
      if (e.key === 'Tab' && overlayRef.current) {
        const focusable = Array.from(
          overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => el.offsetParent !== null)

        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onOpenChange]
  )

  if (!open) return null
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange?.(false)
      }}
    >
      {children}
    </div>,
    document.body
  )
}

interface DialogContentProps {
  children: ReactNode
  className?: string
  'data-testid'?: string
  'aria-describedby'?: string | undefined
  'aria-labelledby'?: string | undefined
}

export function DialogContent({ children, className, 'data-testid': testId, 'aria-describedby': ariaDescribedBy, 'aria-labelledby': ariaLabelledBy }: DialogContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      data-testid={testId}
      tabIndex={-1}
      className={`bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 outline-none ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={`mb-2 ${className ?? ''}`}>
      {children}
    </div>
  )
}

interface DialogTitleProps {
  children: ReactNode
  className?: string
  id?: string
}

export function DialogTitle({ children, className, id }: DialogTitleProps) {
  return (
    <h2 id={id} className={`text-lg font-semibold text-slate-800 ${className ?? ''}`}>
      {children}
    </h2>
  )
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={`flex justify-end gap-3 ${className ?? ''}`}>
      {children}
    </div>
  )
}
