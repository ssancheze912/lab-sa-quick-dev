import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400"
    >
      <InboxIcon className="h-12 w-12" aria-hidden="true" />
      <p className="text-sm text-center">{message}</p>
    </div>
  );
}
