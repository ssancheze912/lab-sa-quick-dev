interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      role="status"
      data-testid="empty-state"
      className="flex flex-col items-center justify-center px-4 py-8 text-center"
    >
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
