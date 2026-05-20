---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-Siesa-Agents-2026-03-10.md"
workflowType: 'prd'
lastStep: 11
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
projectType: web_app
domain: general
complexity: low
projectContext: greenfield
features:
  - "Feature 1: Gestión de Clientes"
  - "Feature 2: Gestión de Contactos"
  - "Feature 3: Asociación Cliente ↔ Contacto"
---

# Product Requirements Document - Siesa-Agents

**Author:** SiesaTeam
**Date:** 2026-03-11

## Executive Summary

A lightweight web application for managing clients and contacts, designed for
commercial and support teams in small and mid-sized businesses. It solves the
critical problem of fragmented data across disconnected systems (Excel, phone
contacts, emails) by unifying both entities in a single place with real
traceability and a first-class bidirectional relationship between them.

The system is intentionally simple and focused: no unnecessary features, no
enterprise overhead. It is scoped to cover the complete Siesa Agents 4-phase
learning cycle (Product Brief → PRD → Epics → Sprint) with a real but bounded
use case.

### What Makes This Special

The client ↔ contact association is not a text field or a note — it is a
navigable first-class entity. But beyond the technical model, the core
differentiator is a UX principle: the user never leaves their current context
to see the related entity. When viewing a client, their contacts are right
there. When viewing a contact, their client is right there. Fluid navigation,
no unnecessary screen jumps.

This is what separates it from enterprise CRMs (too complex) and informal
tools (no relational structure): a focused tool that treats the relationship
as central to the experience, not as an afterthought.

## Project Classification

**Technical Type:** Web Application
**Domain:** General — Internal commercial management for SMBs
**Complexity:** Low
**Project Context:** Greenfield — new project

## Features

### feature — Gestión de Clientes

CRUD completo del catálogo de clientes. Permite crear, consultar, editar y
eliminar registros de clientes con sus datos principales. Incluye búsqueda
por nombre y NIT/RUC, y listado navegable de todos los clientes.

**Campos requeridos:** Nombre, NIT/RUC, Teléfono, Ciudad
**Usuarios principales:** Carlos (consulta), Marcela (administración)
**FRs relacionados:** FR1–FR8

---

### feature — Gestión de Contactos

CRUD completo del catálogo de contactos independientes. Permite registrar,
consultar, editar y eliminar contactos con sus datos de comunicación. Incluye
búsqueda por nombre y email, y visibilidad de contactos no vinculados a ningún
cliente.

**Campos requeridos:** Nombre, Cargo, Teléfono, Email
**Usuarios principales:** Carlos (consulta y registro), Marcela (administración)
**FRs relacionados:** FR9–FR16, FR25

---

### feature — Asociación Cliente ↔ Contacto

Relación bidireccional navegable entre clientes y contactos como entidad de
primera clase. Desde un cliente, el usuario ve y gestiona sus contactos
asociados inline. Desde un contacto, el usuario ve inmediatamente a qué
cliente pertenece. La asociación y desasociación se realiza sin perder el
contexto de navegación actual.

**Usuarios principales:** Carlos (navegación), Marcela (gestión de vínculos)
**FRs relacionados:** FR17–FR24, FR26

---

## Success Criteria

### User Success

The system succeeds when users stop reaching for Excel and rely on the
application as their single source of truth for client and contact data.

**Carlos — Sales Executive:**
- Time to find a client's contact drops from 3–5 minutes to under 30 seconds
- Registers a new client with at least one associated contact in under 2 minutes
- Does not open Excel for contact lookups during an entire work week
- Navigates from a client to any of their contacts in at most 2 clicks
- Views which client a contact belongs to without any additional search

**Marcela — Commercial Coordinator (Admin):**
- Zero duplicate clients in the system at any point
- Daily data maintenance (updates, reassignments, cleanup) completed in
  under 15 minutes
- Full visibility of all clients and their contacts from a single screen

### Business Success

- The application is used as the single source of truth — no parallel Excel
  in active use for client/contact lookups
- Complete Siesa Agents 4-phase learning cycle executed with coherent,
  traceable artifacts across all phases

### Technical Success

- Search response time: < 1 second with up to 500 client records in the
  database
- Supports up to 10 simultaneous users without degradation
- Deployment target: local or development environment — no production SLA
  required for MVP

### Measurable Outcomes

| Outcome | Indicator | Target |
|---|---|---|
| Eliminate data fragmentation | Single system as source of truth | No parallel Excel in active use |
| Reduce contact lookup time | Time from opening app to viewing contact | < 30 seconds |
| Bidirectional navigation | Clicks to navigate client → contact | ≤ 2 clicks |
| Zero-search reverse lookup | Contact → client visibility | No additional search needed |
| Fast registration | New client + contact end-to-end | < 2 minutes |
| Data quality | Duplicate client records | 0 duplicates |
| Admin efficiency | Daily maintenance time | < 15 minutes |
| Performance | Search response time (≤500 records) | < 1 second |

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

## User Journeys

### Journey 1: Carlos — The Call He Was Always Dreading

Carlos is in the middle of reviewing a proposal when his phone rings. It's a
number he half-recognizes — probably someone from Distribuidora Andina, a
client with four or five contacts across different departments. In the old
world, this is the beginning of a small crisis: he minimizes his proposal,
opens the shared Drive folder, waits for the Excel to load, searches by company
name, finds three rows with slight name variations, and still isn't sure which
contact he's about to speak with. By the time he has context, he's already
apologized twice and lost the professional thread of the call.

Today is different. Carlos opens the app, types "Andina", and the client record
appears before he finishes typing. One click: he's on the client detail page.
All contacts are right there — names, roles, phones. He sees "Ramiro Vega —
Procurement Manager" and instantly knows this is the person who handles
approvals. He answers confidently, uses Ramiro's name, and navigates the
conversation without a single awkward pause.

After the call, he notices Ramiro's email is missing. He fills it in directly
from the contact detail, knowing every teammate will see the updated record
immediately. No separate email to Marcela. No note in his personal agenda that
will be forgotten by Friday.

**This journey reveals requirements for:**
- Client search with fast, real-time filtering
- Client detail view with inline contact list (no navigation away)
- Contact detail view accessible in one click from the client
- Inline field editing on contact records

---

### Journey 2: Carlos — First Day Onboarding a New Client

Carlos just closed a deal with a new company: Construcciones del Valle. He's
in the parking lot after the meeting, laptop closed, running on adrenaline. He
needs to get the client and his two contacts into the system before he forgets
the details.

He opens the app on his phone-sized browser, taps "New Client", fills in the
name, NIT, city and phone in under 30 seconds. The client is saved. Now he
adds the first contact — the general manager — links him to Construcciones del
Valle directly from the contact creation form, and does the same for the
operations coordinator. Two minutes from parking lot to fully registered,
associated, and accessible to his whole team.

Back at the office, a colleague asks who to call at the new client. Carlos
says: "Search Construcciones del Valle — it's already there."

**This journey reveals requirements for:**
- New client creation form: minimal required fields, fast to complete
- New contact creation with client association at creation time
- Association link available inline during contact creation
- Mobile-friendly responsive layout

---

### Journey 3: Marcela — Bringing Order to Chaos

It's Monday morning and Marcela has 20 minutes before her team standup. She
opens the client list and immediately spots what she's been dreading: two
entries for the same company — "Textiles Ramírez" and "Textiles Ramirez S.A."
— created by two different vendors who didn't search before adding.

She opens both records side by side (two tabs). One has three contacts, the
other has one. She edits the correct record to add the missing contact,
associates it to the right client, then deletes the duplicate. The whole
team's records are now clean, and she didn't have to send a single message
asking anyone to fix their own entries.

Ten minutes later she's reviewing contacts without an associated client —
a list she can now actually see. She finds two contacts that belong to existing
clients and links them properly. By the time standup begins, the data is
consistent.

The moment that matters most to Marcela: she makes a change, refreshes the
app on her phone, and the change is there. Not "I'll update the Excel and send
the link." Just: it's done, it's live, everyone sees it.

**This journey reveals requirements for:**
- Full client list view with search and browse capability
- Edit and delete operations on both clients and contacts
- Contact list view with ability to filter unassociated contacts
- Real-time data consistency (no local state, server-driven)
- Associate/disassociate contact from client without losing context

---

### Journey 4: Diego — The Decision He Has to Make

Diego doesn't use the system himself. But three weeks after rollout, he asks
Marcela how it's going. She pulls up the client list — 87 clients, all with
at least one contact linked. "Zero duplicates," she says. "And I haven't
touched the Excel in two weeks."

He asks Carlos the same question during a 1:1. Carlos shows him on his phone:
he searches a client name, taps once, and has the full contact list in front
of him. "I used to ask Marcela for this every other day," Carlos says. "Now
I don't."

Diego doesn't need a dashboard or a report. He needs to see that the system
works without him having to manage it. What he observes is: the team adopted
it, data is clean, and no one is complaining. That's his success signal. He
approves continued use and mentions it in the next all-hands as an example of
a tool that actually works.

**This journey reveals requirements for:**
- Zero-friction adoption: the system must work without training or onboarding
  documentation for Carlos-level users
- Admin capabilities sufficient for Marcela to maintain data independently
- No administrative overhead requiring Diego's involvement

---

### Journey Requirements Summary

| Capability Area | Required By | Priority |
|---|---|---|
| Client search with real-time filtering | Journey 1, 2 | MVP |
| Client detail with inline contact list | Journey 1 | MVP |
| Contact detail with client back-link | Journey 1 | MVP |
| New client creation (minimal fields) | Journey 2 | MVP |
| New contact with client association | Journey 2 | MVP |
| Full client list with browse | Journey 3 | MVP |
| Edit and delete clients and contacts | Journey 3 | MVP |
| Unassociated contact visibility | Journey 3 | MVP |
| Associate/disassociate without context loss | Journey 3 | MVP |
| Real-time data consistency | Journey 3 | MVP |
| Zero-friction adoption (no training needed) | Journey 4 | MVP |

## Web Application Specific Requirements

### Project-Type Overview

A Single Page Application (SPA) built with React, delivering dynamic
client-side navigation without full page reloads. Designed for internal
team use with a small, known user base. No public-facing concerns (SEO,
wide browser compatibility, or accessibility mandates) apply at this stage.

### Technical Architecture Considerations

**Rendering Model:** Client-side SPA — all navigation handled client-side
after initial load. Server exposes a REST API; React frontend consumes it.

**State Management:** Component-level or lightweight global state (React
Context or similar) sufficient for the scope. No complex state management
library required at MVP scale.

**Data Fetching:** Standard HTTP requests (fetch / axios) to REST API.
No WebSockets or real-time subscriptions required for MVP.

### Browser Matrix

| Browser | Support Level |
|---|---|
| Chrome (last 2 versions) | Full support |
| Firefox (last 2 versions) | Full support |
| Edge (last 2 versions) | Full support |
| Safari | Best-effort (not a primary target) |
| IE11 / Legacy browsers | Not supported |

### Responsive Design

The app must be functional on both desktop and mobile browser viewports.
Carlos's Journey 2 (onboarding a client from the parking lot) requires
a usable mobile experience. Responsive layout is required; a dedicated
native mobile app is not.

**Breakpoints (minimum):**
- Desktop: ≥ 1024px — primary use case
- Tablet/Mobile: ≥ 375px — secondary, must remain functional

### Performance Targets

- Initial page load: reasonable for a local/dev environment — no CDN
  optimization required at MVP
- Search response time (client → server → render): < 1 second with up
  to 500 client records
- No lazy loading or code-splitting required at MVP scale

### SEO Strategy

Not applicable. The application is internal, not indexed, and not
publicly accessible. No SEO requirements for MVP.

### Accessibility Level

Basic semantic HTML and keyboard navigability are expected as a natural
consequence of using React with standard components. No formal WCAG AA
or AAA compliance required for MVP. Revisit for v2.0 if the tool
expands to a broader user base.

### Implementation Considerations

- **API contract:** Frontend and backend should agree on a clean REST API
  contract early. JSON responses, standard HTTP status codes.
- **Routing:** Client-side routing (React Router or equivalent) for
  navigating between client list, client detail, contact list, contact
  detail without full page reloads.
- **Forms:** Standard controlled forms for CRUD operations. Inline
  validation on required fields before submission.
- **No SSR required:** Client-side rendering only. No Next.js or
  server-side rendering needed for this scope.

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

## Functional Requirements

### Client Management

- FR1: Users can create a new client record with the required fields
  (Name, NIT/RUC, Phone, City)
- FR2: Users can view a paginated or scrollable list of all clients
- FR3: Users can search the client list by client name
- FR4: Users can search the client list by NIT/RUC
- FR5: Users can view the complete details of a specific client record
- FR6: Users can edit any field of an existing client record
- FR7: Users can delete a client record from the system
- FR8: The system prevents saving a client record with missing required
  fields

### Contact Management

- FR9: Users can create a new contact record with the required fields
  (Name, Role/Title, Phone, Email)
- FR10: Users can view a list of all contacts
- FR11: Users can search the contact list by contact name
- FR12: Users can search the contact list by email
- FR13: Users can view the complete details of a specific contact record
- FR14: Users can edit any field of an existing contact record
- FR15: Users can delete a contact record from the system
- FR16: The system prevents saving a contact record with missing required
  fields

### Client–Contact Association

- FR17: Users can associate one or more existing contacts to a client
- FR18: Users can associate a contact to a client at the time of contact
  creation
- FR19: Users can associate a contact to a client from within the client
  detail view without navigating away
- FR20: Users can disassociate a contact from a client without deleting
  either record
- FR21: Users can view all contacts associated with a client directly
  within the client detail view
- FR22: Users can navigate from the client detail view to any associated
  contact's detail view
- FR23: Users can view which client a contact is associated with directly
  from the contact detail view
- FR24: Users can navigate from the contact detail view to the associated
  client's detail view

### Data Quality & Administration

- FR25: Users can identify contacts that are not associated with any client
- FR26: Users can reassign a contact from one client to a different client
- FR27: The system reflects all data changes (create, update, delete,
  associate, disassociate) immediately for all users without requiring a
  manual sync

### Navigation & Access

- FR28: Users can navigate between views (client list, client detail,
  contact list, contact detail) without full page reloads
- FR29: Users can access and use the full application from a mobile
  browser viewport
- FR30: Users can access the application directly via URL routes for any
  view (deep linking)

## Non-Functional Requirements

### Performance

- NFR1: Search operations (client by name/NIT, contact by name/email)
  must return and render results in under 1 second with up to 500 records
  in the database
- NFR2: All CRUD operations (create, edit, delete) must reflect changes
  in the UI in under 2 seconds under normal conditions
- NFR3: The application must remain responsive with up to 10 simultaneous
  active users without measurable degradation

### Security

- NFR4: All data exchanged between the frontend and backend must be
  transmitted over HTTPS in any non-local deployment
- NFR5: The API must validate and sanitize all user inputs before
  persisting data to prevent injection attacks
- NFR6: The application must not expose internal error details or stack
  traces to end users

### Usability

- NFR7: A new user must be able to complete core tasks (find a client,
  view their contacts, register a new client with a contact) without
  any training or documentation
- NFR8: The application must require no more than 2 clicks to navigate
  from a client record to any of its associated contacts
- NFR9: The application must require no additional search or navigation
  to view a contact's associated client from the contact detail view

### Scalability

- NFR10: The system is designed and scoped for a maximum of 500 client
  records, 1,000 contact records, and 10 simultaneous users in MVP
- NFR11: The data model must support future expansion of these limits
  without requiring schema redesign (i.e., no hardcoded limits in the
  data layer)
