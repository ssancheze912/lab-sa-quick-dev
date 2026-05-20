## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — solve the core problem (fragmented
client and contact data with no relational structure) with the minimum
feature set needed for Carlos to resolve a client call in under 30 seconds.

**Guiding principle:** Every feature in the MVP must be directly traceable
to a user journey. If a capability is not required by any journey, it does
not belong in MVP.

**Resource Requirements:** Single developer. Full-stack (React frontend +
REST API backend). Scoped to complete the Siesa Agents 4-phase learning
cycle end-to-end.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1: Carlos finds a client's contact during an unexpected call
- Journey 2: Carlos registers a new client and contacts from the field
- Journey 3: Marcela audits, cleans, and maintains the client/contact data
- Journey 4: Diego observes adoption without needing to manage the system

**Must-Have Capabilities:**

| Capability | Justification |
|---|---|
| Client list with search (name / NIT) | Entry point for all user flows |
| Client CRUD | Core data entity — create, read, update, delete |
| Contact CRUD | Core data entity — create, read, update, delete |
| Associate contact to client (both directions) | The product's core differentiator |
| Client detail view with inline contact list | Journey 1 — Carlos's "aha!" moment |
| Contact detail view with client back-link | Reverse navigation without extra search |
| Disassociate contact from client | Required for Marcela's data cleanup flow |
| Contact creation with inline client association | Journey 2 — field registration |
| Contact search by name / email | Marcela's contact audit workflow |
| Responsive layout (mobile-functional) | Journey 2 requires mobile browser use |

**Nice-to-Have (deferred within MVP if needed):**

| Capability | Notes |
|---|---|
| Paginated client list | Acceptable to defer — ≤500 records tolerable |
| Filter contacts without associated client | Useful for Marcela, not blocking |
| Real-time duplicate detection | Visual detection sufficient for MVP |
| Delete confirmation modal | Good UX, not functionally critical |
| Loading states / empty states | UX polish, not core functionality |

### Post-MVP Features (Phase 2 — v2.0)

- Notes and comments per client (call/visit context)
- Interaction history (calls, meetings, follow-ups)
- Contact roles per client (primary, billing, technical)
- Unified global search across clients and contacts
- Import from Excel for bulk migration
- Authentication and user roles
- Change history and audit log
- Soft delete / recycle bin

### Expansion Vision (Phase 3 — v3.0+)

- Multi-client contact associations
- Activity timelines per client
- Advanced filtering and reporting
- Mobile app (native)
- External integrations (CRM bridge, email sync)

### Risk Mitigation Strategy

**Technical Risk — Bidirectional relationship in UI:**
The core differentiator (navigating client ↔ contact without losing context)
is the highest-risk UX implementation. Mitigated by designing the data model
and routing strategy early, before building UI components.

**Adoption Risk — Team switching from Excel:**
Mitigated by deliberate simplicity. Zero onboarding friction is a hard
requirement (Journey 4). If the system requires explanation, it has failed.

**Resource Risk — Solo developer, end-to-end scope:**
Mitigated by lean scope. The nice-to-have list provides a safe buffer: if
time is constrained, those items can be cut without breaking the core value
proposition.
