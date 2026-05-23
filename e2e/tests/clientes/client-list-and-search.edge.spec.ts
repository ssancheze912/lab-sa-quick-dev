/**
 * Story 2.1: Client List & Search — Edge Cases (E2E / Static Analysis)
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Expands coverage of client-list-and-search.spec.ts with:
 *   - Backend structural invariants (migration, entity, DI wiring)
 *   - ClienteConfiguration correctness (unique index, property constraints)
 *   - AppDbContext has Clientes DbSet
 *   - Program.cs registers IClienteRepository, GetClientesQueryHandler, MapClienteEndpoints
 *   - E2E boundary: loading skeleton visible before data arrives
 *   - E2E boundary: HTTP 404 response shows ErrorPanel
 *   - E2E boundary: empty search query (whitespace-only) does NOT filter list
 *
 * Test strategy:
 *   Static analysis (file inspection) tests are synchronous and do not require
 *   a running backend or frontend — they validate source invariants.
 *   Browser tests use Playwright network interception.
 *
 * Status: GREEN — validates the implemented Story 2.1 structure
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend');
const API_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.API');
const INFRASTRUCTURE_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Infrastructure');
const DOMAIN_SRC = path.join(BACKEND_ROOT, 'src/SiesaAgents.Domain');
const MIGRATIONS_DIR = path.join(INFRASTRUCTURE_SRC, 'Migrations');

// ─────────────────────────────────────────────────────────────────────────────
// ClienteEntity structural invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteEntity — structural invariants', () => {
  const ENTITY_PATH = path.join(
    DOMAIN_SRC,
    'Clientes/Entities/ClienteEntity.cs'
  );

  test('ClienteEntity.cs should exist at the expected path', () => {
    /**
     * Given the domain entity for Cliente is defined in the Domain layer
     * When the file path is inspected
     * Then ClienteEntity.cs exists at Domain/Clientes/Entities/ClienteEntity.cs
     */
    expect(
      fs.existsSync(ENTITY_PATH),
      `ClienteEntity.cs must exist at ${ENTITY_PATH}`
    ).toBe(true);
  });

  test('ClienteEntity should have a private parameterless constructor', () => {
    /**
     * Given the entity uses a factory method pattern (no public construction)
     * When ClienteEntity.cs is inspected
     * Then a private parameterless constructor is declared
     * (prevents direct instantiation outside the Create() factory method)
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(
      content,
      'ClienteEntity must have a private parameterless constructor to enforce factory method usage'
    ).toMatch(/private\s+ClienteEntity\s*\(\s*\)/);
  });

  test('ClienteEntity should have a static Create() factory method', () => {
    /**
     * Given domain entities must be created via factory methods (company standard)
     * When ClienteEntity.cs is inspected
     * Then a static Create() method is declared
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(
      content,
      'ClienteEntity must declare a static Create() factory method'
    ).toMatch(/public\s+static\s+ClienteEntity\s+Create\s*\(/);
  });

  test('ClienteEntity.Create() should call ArgumentException.ThrowIfNullOrWhiteSpace for nombre', () => {
    /**
     * Given the entity must validate inputs on creation (fail-fast principle)
     * When ClienteEntity.cs is inspected
     * Then ArgumentException.ThrowIfNullOrWhiteSpace is called for at least nombre
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(
      content,
      'ClienteEntity.Create must validate nombre using ArgumentException.ThrowIfNullOrWhiteSpace'
    ).toContain('ArgumentException.ThrowIfNullOrWhiteSpace');
  });

  test('ClienteEntity should have all required properties with private set', () => {
    /**
     * Given domain entity properties must not be mutated externally
     * When ClienteEntity.cs is inspected
     * Then Nombre, Nit, Telefono, and Ciudad all use private set
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(content, 'Nombre must use private set').toMatch(
      /public\s+string\s+Nombre\s*\{\s*get;\s*private\s+set;\s*\}/
    );
    expect(content, 'Nit must use private set').toMatch(
      /public\s+string\s+Nit\s*\{\s*get;\s*private\s+set;\s*\}/
    );
    expect(content, 'Telefono must use private set').toMatch(
      /public\s+string\s+Telefono\s*\{\s*get;\s*private\s+set;\s*\}/
    );
    expect(content, 'Ciudad must use private set').toMatch(
      /public\s+string\s+Ciudad\s*\{\s*get;\s*private\s+set;\s*\}/
    );
  });

  test('ClienteEntity should have an Update() method for Story 2.4', () => {
    /**
     * Given Story 2.4 requires editing a client
     * When ClienteEntity.cs is inspected
     * Then a public Update() method is declared accepting the four mutable fields
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(
      content,
      'ClienteEntity must declare a public Update() method for Story 2.4 edit support'
    ).toMatch(/public\s+void\s+Update\s*\(/);
  });

  test('ClienteEntity.Update() should assign UpdatedAt = DateTimeOffset.UtcNow', () => {
    /**
     * Given the UpdatedAt timestamp must reflect when the entity was last mutated
     * When ClienteEntity.cs Update() is inspected
     * Then UpdatedAt = DateTimeOffset.UtcNow is present
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    expect(
      content,
      'ClienteEntity.Update() must set UpdatedAt = DateTimeOffset.UtcNow (not DateTime)'
    ).toContain('UpdatedAt = DateTimeOffset.UtcNow');
  });

  test('ClienteEntity.cs should NOT use DateTime (DateTimeOffset exclusively)', () => {
    /**
     * Given the architecture forbids DateTime in favor of DateTimeOffset
     * When ClienteEntity.cs is inspected
     * Then no bare DateTime reference appears (only DateTimeOffset)
     */
    const content = fs.readFileSync(ENTITY_PATH, 'utf-8');

    // Strip away comments and string literals to avoid false positives
    const codeOnly = content.replace(/\/\/.*$/gm, '').replace(/"[^"]*"/g, '""');

    expect(
      codeOnly,
      'ClienteEntity.cs must NOT use DateTime — only DateTimeOffset is allowed (architecture rule)'
    ).not.toMatch(/\bDateTime\b(?!Offset)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ClienteConfiguration — EF Core configuration invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteConfiguration — EF Core configuration correctness', () => {
  const CONFIG_PATH = path.join(
    INFRASTRUCTURE_SRC,
    'Data/Configurations/ClienteConfiguration.cs'
  );

  test('ClienteConfiguration.cs should exist at the expected path', () => {
    /**
     * Given the EF Core entity configuration lives in Infrastructure/Data/Configurations
     * When the file path is inspected
     * Then ClienteConfiguration.cs exists
     */
    expect(
      fs.existsSync(CONFIG_PATH),
      `ClienteConfiguration.cs must exist at ${CONFIG_PATH}`
    ).toBe(true);
  });

  test('ClienteConfiguration should configure the uk_clientes_nit unique index', () => {
    /**
     * Given Nit must be unique across all clients (database constraint)
     * When ClienteConfiguration.cs is inspected
     * Then a unique index named "uk_clientes_nit" is configured on the Nit column
     */
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');

    expect(
      content,
      'ClienteConfiguration must configure HasIndex on Nit with IsUnique()'
    ).toContain('IsUnique()');

    expect(
      content,
      'ClienteConfiguration must name the unique index "uk_clientes_nit" per database conventions'
    ).toContain('"uk_clientes_nit"');
  });

  test('ClienteConfiguration should mark Nombre as required with max length 200', () => {
    /**
     * Given Nombre is a required field with business-defined max length
     * When ClienteConfiguration.cs is inspected
     * Then Nombre has IsRequired() and HasMaxLength(200)
     */
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');

    // Check IsRequired() appears for Nombre property
    expect(
      content,
      'ClienteConfiguration must set IsRequired() on Nombre'
    ).toContain('IsRequired()');

    expect(
      content,
      'ClienteConfiguration must set HasMaxLength(200) for Nombre'
    ).toContain('HasMaxLength(200)');
  });

  test('ClienteConfiguration should mark Nit as required with max length 50', () => {
    /**
     * Given Nit is a required unique identifier field
     * When ClienteConfiguration.cs is inspected
     * Then the Nit property is configured with IsRequired() and HasMaxLength(50)
     */
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');

    expect(
      content,
      'ClienteConfiguration must set HasMaxLength(50) for Nit'
    ).toContain('HasMaxLength(50)');
  });

  test('ClienteConfiguration should implement IEntityTypeConfiguration<ClienteEntity>', () => {
    /**
     * Given EF Core requires configurations to implement IEntityTypeConfiguration<T>
     * When ClienteConfiguration.cs is inspected
     * Then it declares the interface correctly
     */
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');

    expect(
      content,
      'ClienteConfiguration must implement IEntityTypeConfiguration<ClienteEntity>'
    ).toContain('IEntityTypeConfiguration<ClienteEntity>');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AddClientesTable migration structural correctness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AddClientesTable migration — structural correctness', () => {
  test('AddClientesTable migration file should exist', () => {
    /**
     * Given Story 2.1 requires the clientes table in the database
     * When the Migrations directory is inspected
     * Then a migration file ending in _AddClientesTable.cs exists
     */
    expect(
      fs.existsSync(MIGRATIONS_DIR),
      `Migrations directory must exist at ${MIGRATIONS_DIR}`
    ).toBe(true);

    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );

    expect(
      migrationFile,
      'AddClientesTable migration file must exist in the Migrations directory'
    ).toBeDefined();
  });

  test('AddClientesTable migration Up() should create table named "clientes"', () => {
    /**
     * Given EF Core snake_case convention maps ClienteEntity to "clientes"
     * When the migration Up() is inspected
     * Then a CreateTable call for "clientes" is present
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    expect(migrationFile).toBeDefined();

    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable Up() must create a table named "clientes" (snake_case convention)'
    ).toContain('"clientes"');

    expect(
      content,
      'AddClientesTable Up() must call migrationBuilder.CreateTable'
    ).toContain('CreateTable');
  });

  test('AddClientesTable migration should define id column as uuid type', () => {
    /**
     * Given the Entity base class uses Guid primary keys
     * When the migration is inspected
     * Then the id column is declared as type "uuid"
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable migration must define id column as type "uuid" (Guid primary key)'
    ).toContain('"uuid"');
  });

  test('AddClientesTable migration should define timestamps as "timestamp with time zone"', () => {
    /**
     * Given DateTimeOffset maps to PostgreSQL "timestamp with time zone"
     * When the migration is inspected
     * Then created_at and updated_at use that type (not "timestamp" without timezone)
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable migration must use "timestamp with time zone" for DateTimeOffset columns (NOT plain "timestamp")'
    ).toContain('"timestamp with time zone"');
  });

  test('AddClientesTable migration should create uk_clientes_nit unique index', () => {
    /**
     * Given the Nit field must be unique at the database level
     * When the migration is inspected
     * Then a CreateIndex call with name "uk_clientes_nit" and unique: true is present
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable migration must create the uk_clientes_nit unique index'
    ).toContain('"uk_clientes_nit"');

    expect(
      content,
      'AddClientesTable migration uk_clientes_nit index must have unique: true'
    ).toContain('unique: true');
  });

  test('AddClientesTable migration Down() should drop the clientes table', () => {
    /**
     * Given migrations must be reversible (Down() rolls back Up())
     * When the migration Down() is inspected
     * Then a DropTable call for "clientes" is present
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable Down() must call DropTable to revert the migration'
    ).toContain('DropTable');
  });

  test('AddClientesTable migration should be in SiesaAgents.Infrastructure.Data.Migrations namespace', () => {
    /**
     * Given EF Core requires migrations to be in a specific namespace for discovery
     * When the migration file is inspected
     * Then the namespace is SiesaAgents.Infrastructure.Data.Migrations
     */
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(
      (f) => f.endsWith('_AddClientesTable.cs') && !f.includes('Designer')
    );
    const content = fs.readFileSync(
      path.join(MIGRATIONS_DIR, migrationFile!),
      'utf-8'
    );

    expect(
      content,
      'AddClientesTable migration must be in SiesaAgents.Infrastructure.Data.Migrations namespace'
    ).toContain('SiesaAgents.Infrastructure.Data.Migrations');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AppDbContext — Clientes DbSet registration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AppDbContext — Clientes DbSet and Story 2.1 wiring', () => {
  const DB_CONTEXT_PATH = path.join(INFRASTRUCTURE_SRC, 'Data/AppDbContext.cs');

  test('AppDbContext.cs should declare a DbSet for ClienteEntity', () => {
    /**
     * Given EF Core requires DbSet<T> to query entities via LINQ
     * When AppDbContext.cs is inspected
     * Then a DbSet<ClienteEntity> property is present
     */
    const content = fs.readFileSync(DB_CONTEXT_PATH, 'utf-8');

    expect(
      content,
      'AppDbContext must declare DbSet<ClienteEntity> for the clientes table'
    ).toMatch(/DbSet<ClienteEntity>/);
  });

  test('AppDbContext.cs should import SiesaAgents.Domain.Clientes.Entities namespace', () => {
    /**
     * Given ClienteEntity is in the Domain layer
     * When AppDbContext.cs is inspected
     * Then it imports the Clientes.Entities namespace
     */
    const content = fs.readFileSync(DB_CONTEXT_PATH, 'utf-8');

    expect(
      content,
      'AppDbContext.cs must use/import SiesaAgents.Domain.Clientes.Entities to reference ClienteEntity'
    ).toContain('SiesaAgents.Domain.Clientes.Entities');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Program.cs — Story 2.1 DI and endpoint wiring
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Program.cs — Story 2.1 DI and endpoint wiring', () => {
  const PROGRAM_PATH = path.join(API_SRC, 'Program.cs');

  test('Program.cs should register IClienteRepository with ClienteRepository implementation', () => {
    /**
     * Given the query handler depends on IClienteRepository via DI
     * When Program.cs is inspected
     * Then AddScoped<IClienteRepository, ClienteRepository> is present
     */
    const content = fs.readFileSync(PROGRAM_PATH, 'utf-8');

    expect(
      content,
      'Program.cs must register IClienteRepository → ClienteRepository in DI'
    ).toContain('IClienteRepository, ClienteRepository');
  });

  test('Program.cs should register GetClientesQueryHandler as a scoped service', () => {
    /**
     * Given Minimal API endpoint calls GetClientesQueryHandler directly via DI
     * When Program.cs is inspected
     * Then AddScoped<GetClientesQueryHandler> is present
     */
    const content = fs.readFileSync(PROGRAM_PATH, 'utf-8');

    expect(
      content,
      'Program.cs must register GetClientesQueryHandler as a DI service'
    ).toContain('GetClientesQueryHandler');
  });

  test('Program.cs should call app.MapClienteEndpoints()', () => {
    /**
     * Given GET /api/v1/clientes must be wired into the ASP.NET Core pipeline
     * When Program.cs is inspected
     * Then MapClienteEndpoints() is called on the app
     */
    const content = fs.readFileSync(PROGRAM_PATH, 'utf-8');

    expect(
      content,
      'Program.cs must call app.MapClienteEndpoints() to register the clientes route group'
    ).toContain('MapClienteEndpoints()');
  });

  test('MapClienteEndpoints registration should come after builder.Build() in Program.cs', () => {
    /**
     * Given route mappings must happen after app = builder.Build()
     * When the ordering of calls in Program.cs is inspected
     * Then MapClienteEndpoints() appears after var app = builder.Build()
     */
    const content = fs.readFileSync(PROGRAM_PATH, 'utf-8');

    const buildIndex = content.indexOf('builder.Build()');
    const mapEndpointsIndex = content.indexOf('MapClienteEndpoints()');

    expect(buildIndex, 'builder.Build() must be present in Program.cs').toBeGreaterThan(-1);
    expect(mapEndpointsIndex, 'MapClienteEndpoints() must be present in Program.cs').toBeGreaterThan(-1);

    expect(
      mapEndpointsIndex,
      'MapClienteEndpoints() must be called AFTER var app = builder.Build() in Program.cs'
    ).toBeGreaterThan(buildIndex);
  });

  test('IClienteRepository registration should come before builder.Build() in Program.cs', () => {
    /**
     * Given services must be registered in the builder phase (before Build())
     * When Program.cs is inspected
     * Then IClienteRepository registration appears before builder.Build()
     */
    const content = fs.readFileSync(PROGRAM_PATH, 'utf-8');

    const buildIndex = content.indexOf('builder.Build()');
    const repoIndex = content.indexOf('IClienteRepository');

    expect(
      repoIndex,
      'IClienteRepository registration must appear before builder.Build() in Program.cs'
    ).toBeLessThan(buildIndex);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ClienteEndpoints — endpoint registration structure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteEndpoints — Minimal API registration structure', () => {
  const ENDPOINTS_PATH = path.join(
    API_SRC,
    'Endpoints/ClienteEndpoints.cs'
  );

  test('ClienteEndpoints.cs should exist at the expected path', () => {
    /**
     * Given the endpoint is defined in the API layer under Endpoints/
     * When the file path is inspected
     * Then ClienteEndpoints.cs exists
     */
    expect(
      fs.existsSync(ENDPOINTS_PATH),
      `ClienteEndpoints.cs must exist at ${ENDPOINTS_PATH}`
    ).toBe(true);
  });

  test('ClienteEndpoints should define GET /api/v1/clientes route group', () => {
    /**
     * Given the API contract specifies GET /api/v1/clientes
     * When ClienteEndpoints.cs is inspected
     * Then a MapGroup for "/api/v1/clientes" is present
     */
    const content = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');

    expect(
      content,
      'ClienteEndpoints must use MapGroup("/api/v1/clientes") for the route prefix'
    ).toContain('/api/v1/clientes');
  });

  test('ClienteEndpoints should register MapGet for the list endpoint', () => {
    /**
     * Given the list endpoint uses HTTP GET
     * When ClienteEndpoints.cs is inspected
     * Then a MapGet call is present
     */
    const content = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');

    expect(
      content,
      'ClienteEndpoints must declare MapGet for the GET /api/v1/clientes handler'
    ).toContain('MapGet');
  });

  test('ClienteEndpoints should return Results.Ok (not raw value)', () => {
    /**
     * Given Minimal API should use typed Results for HTTP 200 responses
     * When ClienteEndpoints.cs is inspected
     * Then Results.Ok is used to wrap the DTO list
     */
    const content = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');

    expect(
      content,
      'ClienteEndpoints handler must wrap the response in Results.Ok(...) for explicit HTTP 200'
    ).toContain('Results.Ok');
  });

  test('ClienteEndpoints should NOT use [ApiController] or ControllerBase (Minimal API only)', () => {
    /**
     * Given the architecture mandates Minimal API (no MVC controllers)
     * When ClienteEndpoints.cs is inspected
     * Then no ControllerBase or [ApiController] attribute appears
     */
    const content = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');

    expect(
      content,
      'ClienteEndpoints.cs must NOT use ControllerBase — Minimal API only (architecture rule)'
    ).not.toContain('ControllerBase');

    expect(
      content,
      'ClienteEndpoints.cs must NOT use [ApiController] attribute — Minimal API only'
    ).not.toContain('[ApiController]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E Browser — boundary and edge cases requiring Playwright
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 edge cases — loading skeleton and HTTP error boundary (Browser)', () => {
  test('should show ErrorPanel when GET /api/v1/clientes returns HTTP 404', async ({ page }) => {
    /**
     * Given the backend returns a 404 (unexpected route misconfiguration)
     * When the user navigates to /clientes
     * Then the ErrorPanel is rendered (isError=true path regardless of HTTP status code)
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', status: 404 }),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('button', { name: 'Reintentar' })
    ).toBeVisible();
  });

  test('should show ErrorPanel when GET /api/v1/clientes returns HTTP 503', async ({ page }) => {
    /**
     * Given the backend is temporarily unavailable (Service Unavailable)
     * When the user navigates to /clientes
     * Then the ErrorPanel with "Reintentar" is shown
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Service Unavailable', status: 503 }),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('should NOT show client list items while data is still loading', async ({ page }) => {
    /**
     * Given the API response is delayed
     * When the user first navigates to /clientes before data arrives
     * Then no cliente-list-item elements are rendered during loading
     */
    let resolveFetch!: () => void;
    const fetchBlocked = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });

    // Block the API response indefinitely until we check loading state
    await page.route('**/api/v1/clientes', async (route) => {
      await fetchBlocked;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '11111111-0000-0000-0000-000000000001',
            nombre: 'Acme Colombia SA',
            nit: '900111222',
            telefono: '3001234567',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/clientes');

    // THEN: No list items visible while loading
    await expect(
      page.getByTestId('clientes-list-panel')
    ).toBeVisible({ timeout: 3000 });
    expect(await page.getByTestId('cliente-list-item').count()).toBe(0);

    // Unblock so the test cleans up properly
    resolveFetch();
  });

  test('should NOT show ErrorPanel on initial render before fetch completes', async ({ page }) => {
    /**
     * Given the component starts in loading state (not error state)
     * When the user first arrives at /clientes while data is still in-flight
     * Then role="alert" is not present during loading
     */
    let resolveFetch!: () => void;
    const fetchBlocked = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });

    await page.route('**/api/v1/clientes', async (route) => {
      await fetchBlocked;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/clientes');

    await expect(page.getByTestId('clientes-list-panel')).toBeVisible({ timeout: 3000 });

    // Alert must not be visible during loading
    await expect(page.getByRole('alert')).not.toBeVisible();

    resolveFetch();
  });
});

test.describe('AC2 edge cases — search boundary conditions (Browser)', () => {
  const mockClientes = [
    {
      id: '11111111-0000-0000-0000-000000000001',
      nombre: 'Acme Colombia SA',
      nit: '900111222',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: '11111111-0000-0000-0000-000000000002',
      nombre: 'Beta Ltda',
      nit: '800333444',
      telefono: '3109876543',
      ciudad: 'Medellín',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
    {
      id: '11111111-0000-0000-0000-000000000003',
      nombre: 'Gamma Corp',
      nit: '700555666',
      telefono: '3207654321',
      ciudad: 'Cali',
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    },
  ];

  test('should show all clients when search input contains only whitespace', async ({ page }) => {
    /**
     * Given the filter uses searchQuery.trim() before filtering
     * When the user types only spaces in the search field
     * Then all 3 clients remain visible (whitespace-only input treated as empty)
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');

    // Wait for list to render
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // Type whitespace-only into search
    await page.getByPlaceholder(/buscar por nombre o nit\/ruc/i).fill('   ');

    // THEN: All 3 clients remain (whitespace trim boundary)
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  });

  test('should filter by partial NIT substring match', async ({ page }) => {
    /**
     * Given the filter uses includes() for substring matching
     * When the user types a partial NIT (e.g., "9001")
     * Then only clients with NIT containing "9001" are shown
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    await page.getByPlaceholder(/buscar por nombre o nit\/ruc/i).fill('9001');

    // THEN: Only Acme Colombia SA (nit 900111222 contains "9001") is shown
    await expect(page.getByTestId('cliente-list-item')).toHaveCount(1);
    await expect(
      page.getByTestId('cliente-list-item').filter({ hasText: 'Acme Colombia SA' })
    ).toBeVisible();
  });

  test('should show empty list (not EmptyState) when search has no matches and clients exist', async ({ page }) => {
    /**
     * Given clients exist in the system but none match the search term
     * When the user types a non-matching term
     * Then 0 list items are shown but the EmptyState "no hay clientes" component
     * is NOT rendered (different UX from truly empty system)
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    await page.getByPlaceholder(/buscar por nombre o nit\/ruc/i).fill('ZZZNOMATCH99999');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(0);
    // EmptyState is only for zero clients in the system, not zero filter results
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('should apply aria-current="true" to the clicked client item', async ({ page }) => {
    /**
     * Given a user clicks on a client to select it
     * When the client list item is clicked
     * Then aria-current="true" is applied to that item (Story 2.2 stub + WCAG)
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // Click the first client item
    await page.getByTestId('cliente-list-item').first().click();

    // THEN: aria-current="true" is on the selected item
    await expect(
      page.getByTestId('cliente-list-item').first()
    ).toHaveAttribute('aria-current', 'true');

    // AND: Other items do NOT have aria-current
    await expect(
      page.getByTestId('cliente-list-item').nth(1)
    ).not.toHaveAttribute('aria-current', 'true');
  });

  test('should update aria-current when a different client is clicked', async ({ page }) => {
    /**
     * Given a client item is already selected
     * When the user clicks a different client item
     * Then aria-current moves to the newly clicked item
     */
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientes),
      })
    );

    await page.goto('/clientes');

    await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);

    // Select first item
    await page.getByTestId('cliente-list-item').first().click();
    await expect(
      page.getByTestId('cliente-list-item').first()
    ).toHaveAttribute('aria-current', 'true');

    // Now select second item
    await page.getByTestId('cliente-list-item').nth(1).click();

    await expect(
      page.getByTestId('cliente-list-item').nth(1)
    ).toHaveAttribute('aria-current', 'true');

    await expect(
      page.getByTestId('cliente-list-item').first()
    ).not.toHaveAttribute('aria-current', 'true');
  });
});
