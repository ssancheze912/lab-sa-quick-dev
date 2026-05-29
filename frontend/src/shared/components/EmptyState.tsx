import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <InboxIcon className="w-12 h-12 text-slate-300 mb-3" aria-hidden="true" />
      <p className="text-slate-500 text-sm">{message}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:ring-offset-2"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
