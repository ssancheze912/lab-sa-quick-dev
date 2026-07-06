import { setupServer } from 'msw/node'

/**
 * Shared MSW (Mock Service Worker) node server for component tests.
 *
 * Network-first pattern (see `network-first.md` knowledge fragment): handlers must be
 * registered via `server.use(...)` BEFORE the component under test mounts/triggers its
 * fetch, never after. Started with no default handlers — every test explicitly declares
 * the network behavior it depends on (`onUnhandledRequest: 'error'` in each test file's
 * `beforeAll` surfaces any accidentally-unmocked request instead of silently passing
 * through, per `test-quality.md`'s determinism principle).
 *
 * Story 2.1 introduces this shared server so it can be reused by every future
 * `frontend/src/modules/**` component test (Stories 2.2–2.6, Epic 3 Contactos, etc.)
 * without re-implementing MSW bootstrap per feature.
 */
export const server = setupServer()
