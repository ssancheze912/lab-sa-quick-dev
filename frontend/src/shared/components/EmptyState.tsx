interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
    >
      <p className="text-slate-500 text-sm">{message}</p>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
