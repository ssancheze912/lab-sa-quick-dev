import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc';

export const sortClientes = (clientes: Cliente[], sort: SortOption): Cliente[] => {
  return [...clientes].sort((a, b) => {
    switch (sort) {
      case 'nombre-asc':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'nombre-desc':
        return b.nombre.localeCompare(a.nombre, 'es');
      case 'fecha-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'fecha-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
};
