import { createFileRoute } from '@tanstack/react-router';
import { ContactoDetailView } from '../../modules/crm/contactos/presentation/ContactoDetailView';

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailPage,
});

function ContactoDetailPage() {
  const { contactoId } = Route.useParams();

  return <ContactoDetailView contactoId={contactoId} />;
}
