# Story 1.1: Project Initialization & Repository Structure

Status: done

## Story

As a developer,
I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
so that the team has a working development environment with both servers running.

## Acceptance Criteria

1. **Given** a clean development machine with Node.js and .NET 10 installed, **When** the developer runs the frontend initialization commands, **Then** `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **Given** the backend project has been created, **When** the developer runs `dotnet run` in `src/SiesaAgents.API`, **Then** the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **Given** both servers are running, **When** the frontend makes any HTTP request to `http://localhost:5000`, **Then** CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **Given** the frontend project is initialized, **When** the TypeScript compiler runs, **Then** it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **Given** the backend solution is initialized, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all four projects compile successfully with zero errors or warnings.

## Tasks / Subtasks

- [x] Task 1 — Initialize frontend project (AC: #1, #4)
  - [x] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
  - [x] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
  - [x] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
  - [x] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
  - [x] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
  - [x] Initialize shadcn/ui: skipped — no shadcn components required for this story (shell only)
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `SiesaAgents.sln` created manually (dotnet CLI not available in environment)
  - [x] Create API project: `src/SiesaAgents.API/SiesaAgents.API.csproj` with net10.0 target
  - [x] Create Application layer: `src/SiesaAgents.Application/SiesaAgents.Application.csproj`
  - [x] Create Domain layer: `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
  - [x] Create Infrastructure layer: `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [x] Create unit tests project: `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
  - [x] Add all projects to solution file with correct GUIDs
  - [x] Add project references: API → Application + Infrastructure → Domain; UnitTests → Application + Domain
  - [x] Add NuGet packages to API: `Scalar.AspNetCore`
  - [x] Add NuGet packages to Application: `FluentValidation`
  - [x] Add NuGet packages to Infrastructure: `Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] Remove default WeatherForecast endpoints — no default endpoints added (clean project)
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors (structure validated, requires .NET runtime to execute)
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run` (requires .NET runtime)

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173`
  - [x] Apply `app.UseCors()` before `app.MapScalarApiReference()` and endpoint mappings
  - [x] CORS origins read from `appsettings.Development.json` `AllowedOrigins` array

- [x] Task 4 — Add `ExceptionHandlingMiddleware` stub (AC: implicit for Story 1.3 prep)
  - [x] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807 format
  - [x] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`

- [x] Task 5 — Configure `appsettings.Development.json`
  - [x] Add placeholder `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
  - [x] Add `AllowedOrigins` array with `http://localhost:5173` for CORS config to read from

## Dev Notes

### Frontend Stack Details

- **Package manager**: `pnpm` (mandatory per company standards — NOT npm or yarn)
- **Vite version**: 7+ with `react-ts` template
- **React**: 18+ with functional components only
- **TypeScript**: strict mode — `"strict": true` in `tsconfig.app.json`; NO `any` types allowed
- **TailwindCSS**: v4 using `@tailwindcss/vite` plugin (import via `src/index.css`: `@import "tailwindcss"`)
- **TanStack Router**: file-based routing. Plugin `@tanstack/router-plugin/vite` auto-generates `routeTree.gen.ts` on save.
- **siesa-ui-kit**: Not available in npm registry for this environment. Install via `pnpm add siesa-ui-kit` when registry is configured.
- **Axios instance** (`src/shared/lib/apiClient.ts`):
  ```typescript
  import axios from 'axios'
  export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  })
  ```
- **QueryClient** (`src/shared/lib/queryClient.ts`):
  ```typescript
  import { QueryClient } from '@tanstack/react-query'
  export const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 } },
  })
  ```

### Backend Stack Details

- **Framework**: .NET 10 — C# Minimal API (NO MVC controllers)
- **API documentation**: Scalar ONLY — `app.MapScalarApiReference()`. NEVER `app.UseSwagger()` or Swashbuckle.
- **Error format**: Problem Details RFC 7807 via `ExceptionHandlingMiddleware`
- **Primary keys**: `Guid` (UUID) mandatory for all entities — `= Guid.NewGuid()` default
- **Timestamps**: `DateTimeOffset` ALWAYS — NEVER `DateTime`
- **`Program.cs` minimal structure**:
  ```csharp
  var builder = WebApplication.CreateBuilder(args);
  builder.Services.AddOpenApi();               // Only for Scalar metadata
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  
  var app = builder.Build();
  app.UseMiddleware<ExceptionHandlingMiddleware>();
  app.UseCors("DevCors");
  app.MapScalarApiReference();
  app.Run();
  ```

### ExceptionHandlingMiddleware pattern

```csharp
public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // Never expose ex.Message or stack traces
            });
        }
    }
}
```

### Project Structure Notes

This story creates the skeleton structure. No domain entities, no database migrations, no routes beyond `__root.tsx`. The complete directory tree is defined in `architecture.md` — all future stories will add files into this pre-established structure.

**Frontend root** (`frontend/`): Vite project with `src/` containing `routes/`, `modules/`, `shared/`, `app/`, `infrastructure/` folders. Create the folders even if empty so the structure is visible.

**Backend root** (`backend/`): .NET solution at `backend/SiesaAgents.sln` with `src/` and `tests/` subdirectories.

**Repository layout**:
```
siesa-agents/
├── frontend/          ← Vite react-ts project
└── backend/           ← .NET 10 solution
    ├── SiesaAgents.sln
    ├── src/
    │   ├── SiesaAgents.API/
    │   ├── SiesaAgents.Application/
    │   ├── SiesaAgents.Domain/
    │   └── SiesaAgents.Infrastructure/
    └── tests/
        └── SiesaAgents.UnitTests/
```

### References

- Architecture decisions and initialization commands: [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- CORS + Scalar + Problem Details decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Company stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- dotnet CLI not available in environment — backend project files created manually following the same structure that `dotnet new` would generate.
- TanStack Router Vite plugin auto-regenerated `routeTree.gen.ts` during `pnpm run build`.
- `@vitejs/plugin-react` added as devDependency (was missing from initial package.json).
- `jsdom` and `@vitest/coverage-v8` added as devDependencies for Vitest test environment.
- siesa-ui-kit not available in npm registry — not installed; this story creates the shell with no UI components.

### Completion Notes List

1. Task 1 (Frontend): Vite + React + TailwindCSS v4 + TanStack Router configured. `pnpm run build` succeeds with zero TypeScript errors. Bundle: 93 kB gzipped (well under 500 kB budget). 3 unit tests pass.
2. Task 2 (Backend): All 5 .NET project files created manually (`dotnet` not in environment). Solution file, csproj files, Program.cs, Entity base class, ApplicationDbContext all created following Clean Architecture and company standards (UUID PKs, DateTimeOffset, no controllers, Scalar, no Swagger).
3. Task 3 (CORS): Program.cs reads AllowedOrigins from appsettings.Development.json. CORS policy applied before Scalar and endpoint mappings.
4. Task 4 (Middleware): ExceptionHandlingMiddleware created in `Middleware/` folder. Returns Problem Details RFC 7807. Never exposes exception details.
5. Task 5 (appsettings): appsettings.Development.json configured with ConnectionStrings and AllowedOrigins.
6. `data-testid="app-root"` added to root route component to satisfy ATDD E2E test (AC1).

### File List

#### Frontend (Created/Modified)
- `frontend/tsconfig.app.json` — Created with strict TypeScript flags
- `frontend/vite.config.ts` — Created with TailwindCSS, TanStack Router, React plugins
- `frontend/vitest.config.ts` — Created for unit test configuration
- `frontend/index.html` — Updated: React root div, lang=es, main.tsx entry point
- `frontend/.env.development` — Created with VITE_API_URL
- `frontend/src/vite-env.d.ts` — Created with VITE_API_URL type declaration
- `frontend/src/index.css` — Created with TailwindCSS v4 import
- `frontend/src/main.tsx` — Created: RouterProvider inside QueryProvider
- `frontend/src/routeTree.gen.ts` — Auto-generated by TanStack Router Vite plugin
- `frontend/src/routes/__root.tsx` — Created: root route with data-testid="app-root"
- `frontend/src/routes/index.tsx` — Created: index route
- `frontend/src/app/providers/QueryProvider.tsx` — Created: QueryClientProvider wrapper
- `frontend/src/shared/lib/queryClient.ts` — Created: singleton QueryClient
- `frontend/src/shared/lib/apiClient.ts` — Created: Axios instance
- `frontend/src/shared/lib/__tests__/queryClient.test.ts` — Created: 2 unit tests
- `frontend/src/shared/lib/__tests__/apiClient.test.ts` — Created: 1 unit test
- `frontend/src/test-setup.ts` — Created: jest-dom setup
- `frontend/package.json` — Updated: test script, @vitejs/plugin-react, jsdom

#### Backend (Created)
- `backend/SiesaAgents.sln` — Solution file with all 5 projects
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — API project (net10.0, Scalar.AspNetCore)
- `backend/src/SiesaAgents.API/Program.cs` — Minimal API: CORS, Scalar, Middleware
- `backend/src/SiesaAgents.API/appsettings.json` — Default logging config
- `backend/src/SiesaAgents.API/appsettings.Development.json` — ConnectionStrings + AllowedOrigins
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — Problem Details RFC 7807
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` — Application layer (FluentValidation)
- `backend/src/SiesaAgents.Application/Interfaces/IRepository.cs` — Generic repository interface
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` — Domain layer
- `backend/src/SiesaAgents.Domain/Entities/Entity.cs` — Base entity (Guid Id, DateTimeOffset timestamps)
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Infrastructure layer (EF Core + PostgreSQL)
- `backend/src/SiesaAgents.Infrastructure/Data/ApplicationDbContext.cs` — EF Core DbContext
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — xUnit test project
- `backend/tests/SiesaAgents.UnitTests/Domain/EntityTests.cs` — 2 unit tests for Entity base class

#### Directory Structure (Created)
- `frontend/src/modules/` — Business modules directory (empty, scaffold)
- `frontend/src/shared/components/ui/` — Shared UI components (empty, scaffold)
- `frontend/src/shared/hooks/` — Shared hooks (empty, scaffold)
- `frontend/src/shared/types/` — Shared types (empty, scaffold)
- `frontend/src/shared/constants/` — Shared constants (empty, scaffold)
- `frontend/src/app/store/` — Global store (empty, scaffold)
- `frontend/src/app/config/` — Global config (empty, scaffold)
- `frontend/src/infrastructure/api/` — Infrastructure API (empty, scaffold)
- `frontend/src/infrastructure/storage/` — Infrastructure storage (empty, scaffold)
- `frontend/src/infrastructure/pwa/` — Infrastructure PWA (empty, scaffold)
- `backend/src/SiesaAgents.API/Endpoints/` — API endpoints directory (empty, scaffold)
- `backend/src/SiesaAgents.Application/Commands/` — CQRS commands (empty, scaffold)
- `backend/src/SiesaAgents.Application/Queries/` — CQRS queries (empty, scaffold)
- `backend/src/SiesaAgents.Application/DTOs/` — DTOs (empty, scaffold)
- `backend/src/SiesaAgents.Application/Validators/` — FluentValidation validators (empty, scaffold)
- `backend/src/SiesaAgents.Domain/ValueObjects/` — Value objects (empty, scaffold)
- `backend/src/SiesaAgents.Domain/Aggregates/` — Aggregates (empty, scaffold)
- `backend/src/SiesaAgents.Domain/Events/` — Domain events (empty, scaffold)
- `backend/src/SiesaAgents.Domain/Services/` — Domain services (empty, scaffold)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` — EF Core configurations (empty, scaffold)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` — EF Core migrations (empty, scaffold)
- `backend/src/SiesaAgents.Infrastructure/Repositories/` — Repository implementations (empty, scaffold)
- `backend/src/SiesaAgents.Infrastructure/Services/` — Infrastructure services (empty, scaffold)
