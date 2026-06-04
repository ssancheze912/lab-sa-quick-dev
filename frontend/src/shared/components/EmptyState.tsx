import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message: string;
  description?: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center"
    >
      <InboxIcon className="h-12 w-12 text-slate-400" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-700">{message}</h3>
      {description && (
        <p className="text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
