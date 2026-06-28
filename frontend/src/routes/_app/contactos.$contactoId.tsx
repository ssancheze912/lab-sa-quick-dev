import { createFileRoute } from '@tanstack/react-router';
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView';
import { ContactoDetailView } from '../../modules/crm/contactos/presentation/ContactoDetailView';

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailPage,
});

function ContactoDetailPage() {
  const { contactoId } = Route.useParams();
  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
        <ContactoListView />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContactoDetailView contactoId={contactoId} />
      </div>
    </div>
  );
}
