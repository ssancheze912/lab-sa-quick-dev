import { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useParams } from '@tanstack/react-router';
import { useContactos } from '../application/useContactos';
import { ContactoListItem } from './ContactoListItem';
import { EmptyState } from '../../../../shared/components/EmptyState';
import { ErrorPanel } from '../../../../shared/components/ErrorPanel';

export function ContactoListView() {
  const { data = [], isLoading, isError, refetch } = useContactos();
  const [searchQuery, setSearchQuery] = useState('');

  // Read active contactoId from route params (undefined when at /contactos)
  const params = useParams({ strict: false }) as { contactoId?: string };
  const activeContactoId = params.contactoId;

  const filteredContactos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4" aria-label="Cargando contactos...">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton height={16} width="70%" />
            <Skeleton height={12} width="50%" />
            <Skeleton height={12} width="60%" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorPanel
        onRetry={() => refetch()}
        message="No se pudieron cargar los contactos."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
        aria-label="Buscar contactos"
      />
      {data.length === 0 ? (
        <EmptyState
          title="Sin contactos"
          description="Crea el primer contacto para comenzar."
        />
      ) : (
        <ul className="overflow-y-auto" role="list">
          {filteredContactos.map((c) => (
            <ContactoListItem
              key={c.id}
              contacto={c}
              isActive={c.id === activeContactoId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
