import React from 'react';

// Minimal AlertDialog implementation compatible with shadcn/ui API surface.
// Uses React Portal-like approach via fixed overlay without @radix-ui dependency.

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface AlertDialogChildProps {
  children?: React.ReactNode;
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

export function AlertDialog({ open = false, onOpenChange = () => {}, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({ children }: AlertDialogChildProps) {
  const { open } = React.useContext(AlertDialogContext);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ children }: AlertDialogChildProps) {
  return <div className="mb-4 space-y-1">{children}</div>;
}

export function AlertDialogFooter({ children }: AlertDialogChildProps) {
  return <div className="flex justify-end gap-2 mt-4">{children}</div>;
}

export function AlertDialogTitle({ children }: AlertDialogChildProps) {
  return <h2 className="text-lg font-semibold text-slate-900">{children}</h2>;
}

export function AlertDialogDescription({ children }: AlertDialogChildProps) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export function AlertDialogAction({ children, onClick, disabled, ...props }: AlertDialogActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, onClick, ...props }: AlertDialogCancelProps) {
  const { onOpenChange } = React.useContext(AlertDialogContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(false);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}
