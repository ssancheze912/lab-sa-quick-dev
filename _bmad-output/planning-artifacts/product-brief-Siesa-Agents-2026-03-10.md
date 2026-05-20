---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
date: 2026-03-10
author: SiesaTeam
---

# Product Brief: Sistema de Gestión de Clientes y Contactos

## Executive Summary

El Sistema de Gestión de Clientes y Contactos es una aplicación web liviana y enfocada
diseñada para equipos comerciales y de soporte de pequeñas y medianas empresas. Resuelve
el problema crítico de datos dispersos en múltiples sistemas desconectados (Excel, agendas,
correos), unificando clientes y contactos en un solo lugar con trazabilidad real. Su
propuesta central es tratar la relación cliente ↔ contacto como un ciudadano de primera
clase: una asociación bidireccional real, no un simple campo de texto. A diferencia de los
CRMs enterprise que resultan excesivos para este contexto, esta solución es intencionalmente
simple, adaptada al flujo de trabajo del equipo, y ejecutable como ciclo completo de
aprendizaje de la metodología Siesa Agents.

---

## Core Vision

### Problem Statement

Los equipos comerciales y de soporte de PyMEs gestionan clientes y contactos en sistemas
desconectados: hojas de Excel, agendas de teléfono y correos electrónicos. El resultado es
una acumulación de datos duplicados, inconsistentes y sin trazabilidad. No existe claridad
sobre qué contacto pertenece a qué cliente, ni quién es el interlocutor vigente en cada
relación comercial.

### Problem Impact

El caos de datos tiene costos concretos y crecientes:
- **Errores operativos:** vendedores que llaman al contacto equivocado por información
  desactualizada.
- **Duplicación de registros:** múltiples personas del equipo crean el mismo cliente con
  nombres distintos.
- **Imagen poco profesional:** inconsistencias visibles que deterioran la confianza del
  cliente.
- **Escalabilidad nula:** a medida que crece la cartera, el caos crece
  proporcionalmente, hasta volverse inmanejable y eliminar la visibilidad comercial real.

### Why Existing Solutions Fall Short

Los CRMs enterprise disponibles (HubSpot, Salesforce, Zoho) son excesivos para este
contexto: ofrecen demasiadas funcionalidades que generan fricción, tienen curvas de
aprendizaje altas y costos elevados que no se justifican para el alcance necesario. Las
soluciones informales (Excel, agendas) carecen de estructura relacional y trazabilidad.
No existe una opción liviana, enfocada y adaptada al flujo real del equipo.

### Proposed Solution

Una aplicación web de gestión de clientes y contactos, deliberadamente simple y enfocada,
que unifica ambas entidades con una relación real entre ellas. El usuario puede:
- Gestionar un catálogo de clientes con sus datos principales (CRUD completo).
- Gestionar un catálogo de contactos independientes (CRUD completo).
- Asociar uno o más contactos a un cliente directamente desde el módulo de clientes.
- Navegar la relación en ambas direcciones: ver los contactos de un cliente y los
  clientes de un contacto.

### Key Differentiators

- **Relación bidireccional real:** la asociación cliente ↔ contacto no es un campo de
  texto ni una nota — es una entidad de primera clase navegable en ambas direcciones.
- **Foco y ligereza deliberados:** sin funcionalidades innecesarias. Diseñado para el
  flujo de trabajo real del equipo, no para un catálogo de features impresionante.
- **Ciclo de aprendizaje completo:** el proyecto está dimensionado para recorrer las 4
  fases de Siesa Agents (Product Brief → PRD → Épicas → Sprint) de principio a fin, con
  un caso de uso real pero acotado.

---

## Target Users

### Primary Users

#### Persona 1: Carlos — El Ejecutivo Comercial

**Perfil:**
Carlos tiene 32 años y trabaja como asesor de ventas en una empresa de servicios B2B.
Maneja una cartera de entre 40 y 60 clientes activos, cada uno con múltiples
interlocutores: el gerente que aprueba, el de compras que negocia, y el técnico que
implementa. Trabaja desde su portátil y su celular, siempre en movimiento entre llamadas,
visitas y seguimientos.

**Problema que experimenta:**
Cuando suena el teléfono y es un cliente, Carlos entra en modo búsqueda: abre el Excel
compartido (que puede estar desactualizado), revisa el correo para recordar el contexto,
y si no encuentra lo que necesita, le pregunta a un compañero. Este ritual le consume
hasta el 20% de su jornada — tiempo que debería estar vendiendo.

**Workarounds actuales:**
- Excel compartido en Drive (frecuentemente desactualizado o con versiones en conflicto)
- Agenda personal del celular (datos no compartidos con el equipo)
- Memoria y preguntas a compañeros

**Éxito para Carlos:**
Recibe una llamada, escribe el nombre del cliente, y en 3 segundos tiene en pantalla
todos sus contactos con cargo, teléfono y correo. Sin abrir otro sistema. Sin preguntar.
Sin perder el hilo de la conversación. Ese es su momento "aha!".

---

#### Persona 2: Marcela — La Coordinadora Comercial (Administradora)

**Perfil:**
Marcela tiene 38 años, lidera un equipo de 8 vendedores y es la responsable de que la
información del equipo sea confiable. Actualmente dedica horas semanales a limpiar el
Excel: fusionar duplicados, actualizar contactos que ya no trabajan en el cliente, y
corregir datos que los vendedores ingresaron de formas distintas.

**Problema que experimenta:**
Es la guardiana de la calidad de datos — pero sin herramientas. Cuando detecta un
duplicado, lo corrige manualmente. Cuando un contacto cambia de empresa, actualiza todos
los registros que pueda encontrar. No tiene visibilidad de quién modificó qué ni cuándo.

**Éxito para Marcela:**
Un panel donde puede ver todos los clientes, detectar inconsistencias, asignar o
reasignar contactos, y saber que cuando ella limpia un registro, el cambio se refleja
para todo el equipo de inmediato.

---

### Secondary Users

#### Persona 3: Diego — El Gerente Comercial (Decision Maker)

**Perfil:**
Diego es el jefe del área comercial. No usa el sistema directamente en el día a día,
pero es quien decide si el equipo lo adopta. Su criterio: ¿reduce errores? ¿Mejora el
tiempo de respuesta al cliente? ¿El equipo lo usa sin quejarse?

**Rol en la adopción:**
Necesita evidencia de valor antes de comprometerse con un cambio. TI le preguntará si
es seguro y mantenible. Los vendedores lo adoptarán si les ahorra tiempo — si les
complica la vida, lo abandonan en la primera semana.

**Éxito para Diego:**
Ver que sus vendedores pasan menos tiempo buscando información y más tiempo vendiendo.
Que los errores por contacto equivocado desaparezcan. Que la herramienta no requiera
soporte continuo.

---

### User Journey

**Escenario: Carlos recibe una llamada inesperada de un cliente**

| Etapa | Sin el sistema | Con el sistema |
|---|---|---|
| **Descubrimiento** | Suena el teléfono. Carlos no recuerda quién es el interlocutor. | — |
| **Búsqueda** | Abre Excel, busca por nombre de empresa, no encuentra. Revisa correos. Le pregunta a Marcela. 3-5 minutos perdidos. | Abre la app, escribe el nombre del cliente. En 3 segundos ve todos los contactos con cargo y teléfono. |
| **Acción** | Atiende la llamada sin contexto o pide que le llamen después. | Atiende con contexto completo. Imagen profesional. |
| **Actualización** | Si el contacto cambió de cargo, lo anota en su agenda personal. El Excel queda desactualizado. | Actualiza el contacto directamente en el sistema. Todo el equipo ve el cambio. |
| **Momento "aha!"** | — | Primera vez que resuelve una llamada en menos de 10 segundos, sin salir del sistema. |

---

## Success Metrics

The system succeeds when users stop reaching for Excel and start relying on the application
as their single source of truth for client and contact data. Success is measured at three
levels: individual user behavior, data quality, and learning objectives.

### User Success Metrics

**Carlos — Sales Executive (Primary User):**
- Uses the system at least once per day
- Time to find a client's contact drops from 3–5 minutes to under 30 seconds
- Does not open Excel for contact lookups during an entire work week
- Registers a new client with at least one associated contact in under 2 minutes

**Marcela — Commercial Coordinator (Admin):**
- Zero duplicate clients in the system
- Daily data maintenance (updates, reassignments, cleanup) completed in under 15 minutes
- Full visibility of all clients and their contacts from a single screen

### Business Objectives

| Objective | Indicator | Target |
|---|---|---|
| Eliminate data fragmentation | Single system used as source of truth | No parallel Excel in active use |
| Reduce search time | Time to locate a client contact | < 30 seconds |
| Improve data quality | Duplicate client records | 0 duplicates |
| Fast onboarding | Time to register new client + contact | < 2 minutes |
| Methodology validation | Complete Siesa Agents 4-phase cycle | All artifacts coherent and produced |

### Key Performance Indicators

**Adoption KPIs:**
- Daily active usage by sales team members: ≥ 1 session/day per user
- New client records created per week: reflects active adoption over Excel

**Efficiency KPIs:**
- Contact lookup time: < 30 seconds (baseline: 3–5 minutes)
- New client registration time: < 2 minutes end-to-end
- Admin maintenance time: < 15 minutes/day

**Data Quality KPIs:**
- Duplicate client records: 0
- Contacts without an associated client: tracked and manageable

**Learning Objectives KPIs:**
- Product Brief: completed and validated ✓ (in progress)
- PRD: completed and aligned with Product Brief
- Epics & Stories: comprehensive, traceable to PRD
- Sprint plan: at least one sprint planned with ready-for-dev stories
- Coherence: all artifacts consistent with each other across all 4 phases

---

## MVP Scope

### Core Features

The MVP delivers exactly what's needed to solve Carlos's core problem: finding the right
contact for a client in under 30 seconds. Three capabilities define the MVP:

**1. Client Management (CRUD)**
- Create, read, update, and delete client records
- Required fields: Name, NIT/RUC, Phone, City
- Search clients by name or NIT/RUC
- List view of all clients

**2. Contact Management (CRUD)**
- Create, read, update, and delete contact records
- Required fields: Name, Role/Title, Phone, Email, Associated Client
- A contact must be associated with a client at creation or linked afterwards

**3. Bidirectional Client ↔ Contact Relationship**
- From a client record: view all associated contacts with their fields
- From a contact record: view which client they belong to
- Associate or disassociate contacts from a client without leaving the client context

### Out of Scope for MVP

The following are explicitly excluded from the MVP to maintain focus and feasibility:

| Feature | Rationale |
|---|---|
| Authentication / login | Not needed for single-team internal use in practice context |
| Roles and permissions | Adds complexity without core value at this stage |
| Change history / audit log | Deferred to v2.0 |
| Import from Excel | Manual entry validates the core UX first |
| Notifications | No event-driven workflow in MVP |
| Reports or dashboards | Core value is lookup, not analysis |
| Soft delete / recycle bin | Simple hard delete is sufficient for MVP |

### MVP Success Criteria

The MVP is considered successful when:
- A user can register a new client with at least one associated contact in under 2 minutes
- A user can find a client's contacts in under 30 seconds from any starting point
- Zero duplicate clients exist after Marcela's first data entry session
- No supplementary systems (Excel, phone contacts) are needed for the core lookup workflow
- The full Siesa Agents 4-phase cycle is completed with coherent artifacts

### Future Vision

**Version 2.0 — Relationship Depth:**
- Notes and comments per client (context for visits and calls)
- Interaction history (calls, meetings, follow-ups)
- Contacts with defined roles (primary, billing, technical) per client

**Version 3.0 — Scale and Intelligence:**
- Unified global search across clients and contacts
- Import from Excel for bulk migration
- Advanced contact roles and multi-client contact associations
- Activity timeline per client

**Long-term Vision:**
A lightweight commercial relationship platform that gives small and mid-sized B2B teams
full visibility of their client portfolios without the overhead of enterprise CRM systems.
