## Product Scope

### MVP — Minimum Viable Product

Three capabilities define the MVP:

1. **Client Management (CRUD):** Create, read, update, and delete client
   records. Required fields: Name, NIT/RUC, Phone, City. Search by name or
   NIT/RUC. Paginated list view.

2. **Contact Management (CRUD):** Create, read, update, and delete contact
   records. Required fields: Name, Role/Title, Phone, Email. Search by name
   or email.

3. **Bidirectional Client ↔ Contact Relationship:** From a client record,
   view all associated contacts and associate/disassociate them without
   leaving the client context. From a contact record, view which client they
   belong to — no additional search required.

### Growth Features (Post-MVP)

- Notes and comments per client (context for visits and calls)
- Interaction history (calls, meetings, follow-ups)
- Contacts with defined roles per client (primary, billing, technical)
- Unified global search across clients and contacts
- Import from Excel for bulk migration

### Vision (Future)

A lightweight commercial relationship platform that gives small and mid-sized
B2B teams full visibility of their client portfolios without the overhead of
enterprise CRM systems. Multi-role contacts, activity timelines, and advanced
relationship mapping.

**Explicitly out of scope for MVP:**
Authentication, roles and permissions, change history/audit log, Excel import,
notifications, reports/dashboards, soft delete — all deferred to v2.0+.
