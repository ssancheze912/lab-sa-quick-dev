/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests define expected component behavior BEFORE implementation.
 * They are NOT runnable with Playwright — they serve as the specification
 * for the Vitest+RTL component tests that must be created at:
 *   frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx
 *   frontend/src/modules/crm/clientes/application/useClientes.test.ts
 *   frontend/src/modules/crm/clientes/application/useClienteSearch.test.ts
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel renders client list (Nombre + NIT/RUC per item)
 *   AC2 — Real-time search filters list by nombre or NIT (case-insensitive), < 1s, 500 records
 *   AC3 — EmptyState shown when no clients
 *   AC4 — ErrorPanel + "Reintentar" button on fetch failure
 *   AC5 — Skeleton placeholders (react-loading-skeleton) while loading, NOT a spinner
 *   AC8 — Search does NOT trigger new HTTP call (client-side useMemo filter)
 *   AC10 — Search input has aria-label="Buscar cliente"
 *
 * IMPORTANT: These test descriptions serve as RED-phase specifications.
 * The dev team must implement the following Vitest+RTL tests to satisfy them.
 *
 * Required MSW handler: GET /api/v1/clientes
 * Required test setup:
 *   - QueryClientProvider wrapping component
 *   - MSW server with handlers for /api/v1/clientes
 *   - @testing-library/user-event for interactions
 *   - @testing-library/react for render + queries
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION: ClienteListPanel Component Tests (Vitest + RTL + MSW)
//
// File to create: frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TEST SPEC: AC5 — Skeleton loading state
 *
 * describe('ClienteListPanel — Loading state', () => {
 *   test('should render skeleton placeholders (not spinner) while API request is in flight', async () => {
 *     // GIVEN: MSW delays response to GET /api/v1/clientes by 500ms
 *     server.use(
 *       http.get('/api/v1/clientes', async () => {
 *         await delay(500);
 *         return HttpResponse.json([]);
 *       })
 *     );
 *
 *     // WHEN: ClienteListPanel is rendered before response resolves
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *
 *     // THEN: Skeleton elements are visible (react-loading-skeleton)
 *     expect(document.querySelector('.react-loading-skeleton')).toBeInTheDocument();
 *     // AND: No spinner is rendered
 *     expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
 *   });
 * });
 */

/**
 * TEST SPEC: AC1 — Client list renders with Nombre and NIT
 *
 * describe('ClienteListPanel — Client list rendering', () => {
 *   test('should render all client list items with Nombre and NIT/RUC', async () => {
 *     // GIVEN: MSW returns 3 clients
 *     server.use(
 *       http.get('/api/v1/clientes', () =>
 *         HttpResponse.json([
 *           { id: '1', nombre: 'Empresa Alpha', nit: '900111', ... },
 *           { id: '2', nombre: 'Beta Ltda', nit: '800222', ... },
 *           { id: '3', nombre: 'Gamma SAS', nit: '700333', ... },
 *         ])
 *       )
 *     );
 *
 *     // WHEN: ClienteListPanel renders and data loads
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *     await waitForElementToBeRemoved(() => document.querySelector('.react-loading-skeleton'));
 *
 *     // THEN: 3 list items visible
 *     expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
 *     // AND: Nombre visible
 *     expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
 *     // AND: NIT visible
 *     expect(screen.getByText('900111')).toBeInTheDocument();
 *   });
 * });
 */

/**
 * TEST SPEC: AC3 — EmptyState
 *
 * describe('ClienteListPanel — Empty state', () => {
 *   test('should render EmptyState with guidance message when API returns empty array', async () => {
 *     // GIVEN: MSW returns empty array
 *     server.use(http.get('/api/v1/clientes', () => HttpResponse.json([])));
 *
 *     // WHEN: ClienteListPanel renders
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *     await waitFor(() => expect(screen.queryByTestId('empty-state')).toBeInTheDocument());
 *
 *     // THEN: EmptyState with correct message
 *     expect(screen.getByTestId('empty-state')).toBeInTheDocument();
 *     expect(screen.getByText(/no hay clientes registrados\. crea el primero\./i)).toBeInTheDocument();
 *     // AND: No list items
 *     expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
 *   });
 * });
 */

/**
 * TEST SPEC: AC4 — ErrorPanel with Reintentar
 *
 * describe('ClienteListPanel — Error state', () => {
 *   test('should render ErrorPanel with Reintentar button when GET /api/v1/clientes returns 500', async () => {
 *     // GIVEN: MSW returns 500
 *     server.use(
 *       http.get('/api/v1/clientes', () => new HttpResponse(null, { status: 500 }))
 *     );
 *
 *     // WHEN: ClienteListPanel renders and query fails
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *     await waitFor(() => expect(screen.queryByTestId('error-panel')).toBeInTheDocument());
 *
 *     // THEN: ErrorPanel is visible
 *     expect(screen.getByTestId('error-panel')).toBeInTheDocument();
 *     // AND: Reintentar button is present
 *     expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
 *     // AND: No list items or empty state
 *     expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
 *   });
 * });
 */

/**
 * TEST SPEC: AC2 — Real-time search by Nombre (case-insensitive)
 *
 * describe('ClienteListPanel — Search functionality', () => {
 *   test('should filter list in real-time by Nombre (case-insensitive) without new HTTP call', async () => {
 *     // GIVEN: MSW returns 3 clients, panel is loaded
 *     const fetchSpy = vi.fn();
 *     server.use(
 *       http.get('/api/v1/clientes', () => {
 *         fetchSpy();
 *         return HttpResponse.json([
 *           { id: '1', nombre: 'Empresa Alpha SA', nit: '900111', ... },
 *           { id: '2', nombre: 'Beta Comercial', nit: '800222', ... },
 *           { id: '3', nombre: 'Gamma SAS', nit: '700333', ... },
 *         ]);
 *       })
 *     );
 *
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *     await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));
 *     expect(fetchSpy).toHaveBeenCalledTimes(1);
 *
 *     // WHEN: User types "alpha" in the search input
 *     await userEvent.type(screen.getByRole('textbox', { name: 'Buscar cliente' }), 'alpha');
 *
 *     // THEN: Only matching clients are shown
 *     expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
 *     expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument();
 *     expect(screen.queryByText('Beta Comercial')).not.toBeInTheDocument();
 *     // AND: No additional HTTP call was made (AC8)
 *     expect(fetchSpy).toHaveBeenCalledTimes(1);
 *   });
 * });
 */

/**
 * TEST SPEC: AC2 — Real-time search by NIT/RUC (case-insensitive)
 *
 *   test('should filter list by NIT/RUC without new HTTP call', async () => {
 *     // GIVEN: clients loaded (see above)
 *
 *     // WHEN: User types partial NIT "800" in the search input
 *     await userEvent.type(screen.getByRole('textbox', { name: 'Buscar cliente' }), '800');
 *
 *     // THEN: Only clients with NIT containing "800" are shown
 *     expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
 *     expect(screen.getByText('Beta Comercial')).toBeInTheDocument();
 *   });
 */

/**
 * TEST SPEC: AC2 + NFR1 — Search performance over 500 records < 1s
 *
 *   test('should filter 500 clients in under 1 second', async () => {
 *     // GIVEN: MSW returns 500 client records
 *     const bulkClients = Array.from({ length: 500 }, (_, i) => ({
 *       id: `${i}`,
 *       nombre: `Cliente ${i}`,
 *       nit: `NIT${i.toString().padStart(9, '0')}`,
 *       telefono: null, ciudad: null,
 *       createdAt: '2026-01-01T00:00:00Z',
 *       updatedAt: '2026-01-01T00:00:00Z',
 *     }));
 *     server.use(http.get('/api/v1/clientes', () => HttpResponse.json(bulkClients)));
 *
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *     await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500));
 *
 *     // WHEN: User types a search query
 *     const start = performance.now();
 *     await userEvent.type(screen.getByRole('textbox', { name: 'Buscar cliente' }), 'Clie');
 *     const elapsed = performance.now() - start;
 *
 *     // THEN: Filter completes in under 1000ms
 *     expect(elapsed).toBeLessThan(1000);
 *   });
 */

/**
 * TEST SPEC: AC10 — Search input accessibility
 *
 *   test('should have aria-label="Buscar cliente" on the search input', async () => {
 *     // GIVEN: ClienteListPanel is rendered
 *     render(<ClienteListPanel onSelect={() => {}} />, { wrapper });
 *
 *     // WHEN: The search input renders
 *     const searchInput = screen.getByRole('textbox', { name: 'Buscar cliente' });
 *
 *     // THEN: aria-label is correct
 *     expect(searchInput).toHaveAttribute('aria-label', 'Buscar cliente');
 *   });
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION: useClientes Hook Tests (Vitest + MSW)
//
// File to create: frontend/src/modules/crm/clientes/application/useClientes.test.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * describe('useClientes — TanStack Query hook', () => {
 *   test('should return array of clients on successful fetch', async () => {
 *     // GIVEN: MSW returns 2 clients
 *     // WHEN: useClientes() is called
 *     // THEN: data is an array of 2 Cliente objects
 *   });
 *
 *   test('should set isError to true when GET /api/v1/clientes fails with network error', async () => {
 *     // GIVEN: MSW returns 500
 *     // WHEN: useClientes() is called
 *     // THEN: isError === true, data === undefined
 *   });
 *
 *   test('should set isLoading to true before data resolves', async () => {
 *     // GIVEN: MSW delays response
 *     // WHEN: useClientes() is called and response not yet received
 *     // THEN: isLoading === true
 *   });
 * });
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICATION: useClienteSearch Hook Tests (Vitest — pure unit)
//
// File to create: frontend/src/modules/crm/clientes/application/useClienteSearch.test.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * describe('useClienteSearch — client-side search hook', () => {
 *   test('should return all clients when query is empty string', () => {
 *     // GIVEN: 3 clients, query = ''
 *     // THEN: returns all 3 clients
 *   });
 *
 *   test('should filter clients by nombre (case-insensitive)', () => {
 *     // GIVEN: clients = [{ nombre: 'Alpha SA' }, { nombre: 'Beta Ltda' }], query = 'alpha'
 *     // THEN: returns only [{ nombre: 'Alpha SA' }]
 *   });
 *
 *   test('should filter clients by NIT (case-insensitive)', () => {
 *     // GIVEN: clients = [{ nit: '900111' }, { nit: '800222' }], query = '900'
 *     // THEN: returns only [{ nit: '900111' }]
 *   });
 *
 *   test('should return empty array when no client matches the query', () => {
 *     // GIVEN: 3 clients, query = 'xyz_no_match'
 *     // THEN: returns []
 *   });
 *
 *   test('should NOT trigger any HTTP call (pure memoized filter)', () => {
 *     // GIVEN: 3 clients already in memory
 *     // WHEN: query changes
 *     // THEN: no fetch is triggered (verified by spy on fetch)
 *   });
 * });
 */

// This file is a RED-phase specification. The actual Vitest+RTL tests must be
// implemented in the frontend/ directory as described above.
export {};
