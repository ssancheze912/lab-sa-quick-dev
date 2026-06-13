import { ClienteListPanel } from './ClienteListPanel';

export function ClientesPage() {
  return (
    <div className="flex flex-row h-full">
      <ClienteListPanel />
      <div className="flex-1" />
    </div>
  );
}
