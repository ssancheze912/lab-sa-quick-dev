# Story 1.1: Project Initialization & Repository Structure

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
so that the team has a working development environment with both servers running.

## Acceptance Criteria

1. **Given** a clean development machine with Node.js 20+ and .NET 10 SDK installed, **when** the developer runs the frontend initialization commands inside `frontend/`, **then** `pnpm run dev` starts the Vite dev server on port 5173 with no compilation errors, TypeScript strict mode is enabled in `tsconfig.app.json` (`"strict": true`), and the browser shows the default Vite + React welcome page.

2. **Given** the backend solution has been scaffolded, **when** the developer runs `dotnet run` inside `backend/src/SiesaAgents.API/`, **then** the backend starts on port 5000 (HTTP), the Scalar API reference page loads at `http://localhost:5000/scalar`, and NO Swagger/OpenAPI middleware is registered.

3. **Given** the backend solution exists, **when** inspecting `SiesaAgents.sln`, **then** it references exactly four projects: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, and `SiesaAgents.Infrastructure`, plus the `SiesaAgents.UnitTests` test project — all with correct project-to-project references (API → Application → Domain; Infrastructure → Domain; API → Infrastructure).

4. **Given** both servers are running (frontend on 5173, backend on 5000), **when** the frontend JavaScript makes a fetch/axios request to `http://localhost:5000/api/v1/health`, **then** the backend responds with HTTP 200 and CORS headers allow the origin `http://localhost:5173` without errors in the browser console.

5. **Given** the frontend project, **when** running `pnpm run build`, **then** the build completes with no TypeScript errors and no ESLint errors.

6. **Given** the backend project, **when** running `dotnet build`, **then** the entire solution compiles with zero warnings and zero errors.

7. **Given** the frontend project structure, **when** inspecting `frontend/src/`, **then** the following directories exist: `routes/`, `modules/`, `shared/components/`, `shared/lib/`, `app/providers/`, and `infrastructure/api/` — matching the Clean Architecture + DDD frontend folder structure.

8. **Given** the backend Infrastructure project, **when** inspecting `AppDbContext.cs`, **then** `modelBuilder.ApplySnakeCaseNaming()` is called last in `OnModelCreating` and no `[Column]` or `[Table]` attributes are present on any entity.

## Tasks / Subtasks

- [ ] Task 1 — Initialize repository structure (AC: 3, 7)
  - [ ] 1.1 Create root `siesa-agents/` directory with `frontend/` and `backend/` subdirectories
  - [ ] 1.2 Add root `.gitignore` covering Node, .NET, and IDE files
  - [ ] 1.3 Add root `README.md` with dev-server startup instructions

- [ ] Task 2 — Scaffold frontend with Vite react-ts (AC: 1, 5, 7)
  - [ ] 2.1 Run `pnpm create vite@latest frontend -- --template react-ts` from root
  - [ ] 2.2 Configure `tsconfig.app.json` with `"strict": true` and `"noUnusedLocals": true`, `"noUnusedParameters": true`
  - [ ] 2.3 Install all required dependencies:
    ```bash
    pnpm install siesa-ui-kit
    pnpm install @tanstack/react-router @tanstack/react-query zustand axios
    pnpm install react-hook-form zod @hookform/resolvers react-loading-skeleton
    pnpm install tailwindcss @tailwindcss/vite
    pnpm install -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin
    ```
  - [ ] 2.4 Install shadcn/ui via CLI: `pnpm dlx shadcn@latest init` and add `dialog` and `breadcrumb` components
  - [ ] 2.5 Configure TailwindCSS v4 in `vite.config.ts` using `@tailwindcss/vite` plugin
  - [ ] 2.6 Create directory scaffold under `src/`: `routes/`, `modules/crm/clientes/`, `modules/crm/contactos/`, `shared/components/`, `shared/lib/`, `app/providers/`, `infrastructure/api/`
  - [ ] 2.7 Create `src/shared/lib/apiClient.ts` — Axios singleton with `baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000'` and content-type interceptors
  - [ ] 2.8 Create `src/shared/lib/queryClient.ts` — TanStack QueryClient with `staleTime: 1000 * 30` and `retry: 1`
  - [ ] 2.9 Create `src/app/providers/AppProviders.tsx` wrapping `QueryClientProvider` and `RouterProvider`
  - [ ] 2.10 Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [ ] 2.11 Verify `pnpm run dev` starts on port 5173 with no errors

- [ ] Task 3 — Scaffold backend .NET 10 Clean Architecture solution (AC: 2, 3, 6, 8)
  - [ ] 3.1 From `backend/`, run:
    ```bash
    dotnet new sln -n SiesaAgents
    dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API
    dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application
    dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain
    dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure
    dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests
    ```
  - [ ] 3.2 Add all projects to solution and configure project references:
    - API → Application, Infrastructure
    - Application → Domain
    - Infrastructure → Application, Domain
    - UnitTests → Application, Domain
  - [ ] 3.3 Install NuGet packages:
    ```bash
    dotnet add src/SiesaAgents.API package Scalar.AspNetCore
    dotnet add src/SiesaAgents.Application package FluentValidation
    dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
    dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions
    ```
  - [ ] 3.4 Configure `Program.cs` in SiesaAgents.API:
    - Register `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
    - Register CORS policy allowing origin `http://localhost:5173`
    - Register `ExceptionHandlingMiddleware`
    - Register a `GET /api/v1/health` endpoint returning `{ "status": "healthy" }`
  - [ ] 3.5 Create `Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807 for all unhandled exceptions (no stack traces)
  - [ ] 3.6 Create `Data/AppDbContext.cs` in SiesaAgents.Infrastructure:
    - Inherit `DbContext`
    - Override `OnModelCreating` — call `modelBuilder.ApplySnakeCaseNaming()` as LAST statement
    - No `[Column]` or `[Table]` attributes anywhere
  - [ ] 3.7 Create `appsettings.Development.json` with connection string placeholder:
    ```json
    { "ConnectionStrings": { "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres" } }
    ```
  - [ ] 3.8 Verify `dotnet build` compiles entire solution with zero errors and zero warnings
  - [ ] 3.9 Verify `dotnet run` (from SiesaAgents.API) starts on port 5000 and `/scalar` responds

- [ ] Task 4 — CORS validation (AC: 4)
  - [ ] 4.1 With both servers running, open browser DevTools → Network tab and confirm a request from `localhost:5173` to `localhost:5000/api/v1/health` returns 200 with `Access-Control-Allow-Origin: http://localhost:5173`
  - [ ] 4.2 Confirm no CORS errors appear in browser console

- [ ] Task 5 — Unit tests scaffold (AC: 3, 6)
  - [ ] 5.1 Verify `SiesaAgents.UnitTests` project builds and `dotnet test` runs with zero test failures (empty test run is acceptable at this stage)
  - [ ] 5.2 Add a placeholder smoke test: `Assert.True(true)` with a `//TODO: implement real tests in next stories` comment

## Dev Notes

### Architecture Context

This story creates the entire project skeleton. No domain entities, no business logic, and no database tables are created here. Subsequent stories will add those layers.

- **Frontend**: standalone SPA, NOT a microfrontend (Single-SPA rules do not apply for this project — it is a standalone deployment)
- **Backend**: single monolithic service (Clean Architecture layers as code structure, NOT distributed microservices) — NFR10 scale (10 users, 500 records) does not warrant microservices
- **Ports**: frontend 5173, backend 5000 (HTTP) — hardcoded in dev; production uses env vars

### Frontend Key Rules

- Package manager: **pnpm** (never npm or yarn for new files)
- TypeScript strict mode: NO `any` type allowed anywhere
- All user-facing text MUST be in Spanish (relevant for future stories; scaffold currently has no user text)
- TanStack Router: file-based routing under `src/routes/` — do NOT use `createRouter` manually without the file-based plugin
- siesa-ui-kit is the P0 UI library — check its catalog before using shadcn or custom components (not applicable for this story as there is no UI to build, only the scaffold)

### Backend Key Rules

- Primary keys: **UUID (Guid)** for ALL entities — `public Guid Id { get; protected set; } = Guid.NewGuid();`
- Timestamps: **DateTimeOffset** always, NEVER `DateTime`
- API docs: **Scalar** only — NEVER `app.UseSwagger()` or `app.UseSwaggerUI()`
- Error format: Problem Details RFC 7807 via `ExceptionHandlingMiddleware`
- EF Core: `ApplySnakeCaseNaming()` called LAST in `OnModelCreating` — no manual `[Column]` or `[Table]` attributes
- CQRS pattern: Commands (write) and Queries (read) in separate classes with handlers — to be wired in Epic 2+

### Database (relevant for future stories, not this one)

- PostgreSQL 18+ with database name `siesa_agents_db`
- snake_case column/table names enforced via `EFCore.NamingConventions` package
- UUID primary keys (`Guid.NewGuid()`)
- `DateTimeOffset` for all timestamps
- No domain tables created in this story — the initial migration (empty) is deferred to Story 1.3

### Minimal API Pattern (for reference in future stories)

```csharp
// Pattern: register endpoints in a static extension method
public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/health", () => Results.Ok(new { status = "healthy" }))
           .WithName("GetHealth")
           .WithTags("Health");
    }
}
```

### Axios apiClient Pattern

```typescript
// src/shared/lib/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});
```

### Project Structure Notes

**Frontend** (`frontend/src/`) must match exactly:
```
routes/                         # TanStack Router file-based routing
modules/
  crm/
    clientes/
      domain/entities/
      domain/repositories/
      application/hooks/
      infrastructure/api/
      presentation/
    contactos/
      domain/entities/
      domain/repositories/
      application/hooks/
      infrastructure/api/
      presentation/
shared/
  components/
  lib/
    apiClient.ts
    queryClient.ts
app/
  providers/
    AppProviders.tsx
infrastructure/
  api/
```

**Backend** (`backend/`) must match exactly:
```
SiesaAgents.sln
src/
  SiesaAgents.API/
    Program.cs
    Endpoints/
    Middleware/
      ExceptionHandlingMiddleware.cs
  SiesaAgents.Application/
    SiesaAgents.Application.csproj
  SiesaAgents.Domain/
    SiesaAgents.Domain.csproj
  SiesaAgents.Infrastructure/
    Data/
      AppDbContext.cs
    SiesaAgents.Infrastructure.csproj
tests/
  SiesaAgents.UnitTests/
    SiesaAgents.UnitTests.csproj
```

### Detected Conflicts / Variances

- `npm` is mentioned in architecture.md initialization commands, but company standards mandate `pnpm` for new projects. **Use pnpm throughout.**
- Architecture.md mentions `dotnet new webapi -n SiesaAgents.API --no-openapi` which removes OpenAPI. This is correct — Scalar replaces it. Do not re-add OpenAPI.
- Architecture.md lists `SiesaAgents.IntegrationTests` project, but sprint-status only covers `SiesaAgents.UnitTests` in this story. Integration tests setup is deferred to Story 1.3.

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`] — initialization commands for frontend and backend
- [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`] — canonical file tree for both frontend and backend
- [Source: `_bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied`] — Vite 7+, React 18+, .NET 10, EF Core 10
- [Source: `_bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment`] — ports 5173 (frontend) and 5000 (backend)
- [Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.1`] — acceptance criteria from epic
- [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`] — pnpm, TypeScript strict, DateTimeOffset, Scalar, snake_case, siesa-ui-kit

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
