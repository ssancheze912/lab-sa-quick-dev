import { useState } from 'react';
import { ClienteListView } from './ClienteListView';

export function ClientesView() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  return (
    <div data-testid="clientes-view" className="flex h-full">
      <ClienteListView selectedId={selectedId} onClienteSelect={setSelectedId} />
      {/* Right panel — placeholder for Story 2.2 */}
      <div className="flex-1" aria-label="Detalle del cliente" />
    </div>
  );
}
