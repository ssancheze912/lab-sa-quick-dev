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
