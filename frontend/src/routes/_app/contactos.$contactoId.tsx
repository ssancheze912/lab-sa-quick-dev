import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ContactoDetailView } from '../../modules/crm/contactos/presentation/ContactoDetailView';

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailPage,
});

function ContactoDetailPage() {
  const { contactoId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <ContactoDetailView
      contactoId={contactoId}
      onContactoDeleted={() => navigate({ to: '/contactos' })}
    />
  );
}
