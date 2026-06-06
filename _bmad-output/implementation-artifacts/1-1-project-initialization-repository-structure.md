# Story 1.1: Project Initialization & Repository Structure

Status: review

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
  - [x] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb` (shadcn CLI requires network access; core deps installed manually + dialog/breadcrumb components created)
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `dotnet new sln -n SiesaAgents`
  - [x] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
  - [x] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
  - [x] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
  - [x] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
  - [x] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
  - [x] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
  - [x] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
  - [x] Add NuGet packages to API: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
  - [x] Add NuGet packages to Application: `dotnet add src/SiesaAgents.Application package FluentValidation`
  - [x] Add NuGet packages to Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] Remove default WeatherForecast endpoints and models from the generated API project
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173`
  - [x] Apply `app.UseCors()` before `app.MapScalarApiReference()` and endpoint mappings
  - [x] Verify: open browser dev tools, frontend request to backend returns no CORS errors

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
- **siesa-ui-kit**: Install via `pnpm add siesa-ui-kit`. Required for all UI components. Check catalog before any custom component.
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

- shadcn/ui CLI (`pnpx shadcn@latest init`) requires external network access to ui.shadcn.com which was unavailable. Resolved by installing core shadcn deps manually (`@radix-ui/react-dialog`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) and creating dialog/breadcrumb components manually.
- .NET 10 `dotnet new sln` creates `.slnx` format by default. Added `--format sln` flag to also generate classic `.sln` for AC#5 compatibility.
- `WriteAsJsonAsync` overrides Content-Type header. Fixed middleware to use `WriteAsync` with manual JSON serialization to preserve `application/problem+json`.
- ATDD correction (attempt 1): `ExceptionHandlingMiddleware` only catches thrown exceptions — it does not intercept .NET routing 404s for unmatched routes. Fixed by adding `app.UseStatusCodePages()` in `Program.cs` that returns `application/problem+json` Problem Details for all HTTP error status codes including 404.
- ATDD correction (attempt 1): `frontend/index.html` was missing `data-testid="app-root"` on the `div#root` element. Added attribute so Playwright `locator('[data-testid="app-root"]')` resolves correctly.

### Completion Notes List

- Frontend: React 19 + Vite 8 + TypeScript 6 project initialized with strict mode. All dependencies installed. TailwindCSS v4 with `@import "tailwindcss"` in index.css.
- Frontend: TanStack Router configured with file-based routing plugin. `routeTree.gen.ts` stub created; plugin auto-generates on dev server start.
- Frontend: `@/` path alias configured in both `tsconfig.app.json` and `vite.config.ts`.
- Backend: .NET 10 Clean Architecture solution with 4 projects + unit tests. All project references follow dependency rule (dependencies point inward).
- Backend: Program.cs follows minimal API pattern with Scalar, CORS from appsettings, and ExceptionHandlingMiddleware registered before routing.
- Tests: 4 frontend unit tests pass (apiClient + queryClient). 4 backend unit tests pass (ExceptionHandlingMiddleware). Zero regressions.

### File List

#### Frontend (Created)
- `frontend/package.json` — Dependencies with React 19, TanStack Router/Query, Zustand, Axios, Zod, siesa-ui-kit, TailwindCSS v4, Vitest
- `frontend/tsconfig.app.json` — strict/noImplicitAny/strictNullChecks enabled, @/ path alias
- `frontend/vite.config.ts` — TanStackRouterVite + react + tailwindcss plugins, @/ alias
- `frontend/vitest.config.ts` — Node environment test config
- `frontend/components.json` — shadcn/ui config
- `frontend/.env.development` — VITE_API_URL=http://localhost:5000
- `frontend/src/index.css` — @import "tailwindcss" prepended
- `frontend/src/main.tsx` — RouterProvider inside QueryProvider
- `frontend/src/routeTree.gen.ts` — Route tree stub (auto-generated by plugin on dev server start)
- `frontend/src/routes/__root.tsx` — TanStack Router root route with Outlet
- `frontend/src/app/providers/QueryProvider.tsx` — QueryClientProvider wrapper
- `frontend/src/shared/lib/queryClient.ts` — Singleton QueryClient
- `frontend/src/shared/lib/apiClient.ts` — Axios instance with baseURL + JSON headers
- `frontend/src/shared/lib/utils.ts` — cn() utility for shadcn/ui
- `frontend/src/shared/components/ui/dialog.tsx` — shadcn Dialog components
- `frontend/src/shared/components/ui/breadcrumb.tsx` — shadcn Breadcrumb components
- `frontend/src/test/setup.ts` — Vitest setup file
- `frontend/src/shared/lib/apiClient.test.ts` — Unit tests for apiClient
- `frontend/src/shared/lib/queryClient.test.ts` — Unit tests for queryClient
- `frontend/src/modules/` — Empty folder (future business modules)
- `frontend/src/infrastructure/` — Empty folder (future global infrastructure)

#### Backend (Created)
- `backend/SiesaAgents.sln` — Solution file (classic format for tooling compatibility)
- `backend/SiesaAgents.slnx` — Solution file (new .NET 10 format)
- `backend/src/SiesaAgents.API/Program.cs` — Minimal API: Scalar, CORS, ExceptionHandlingMiddleware
- `backend/src/SiesaAgents.API/Properties/launchSettings.json` — Port 5000 HTTP profile
- `backend/src/SiesaAgents.API/appsettings.Development.json` — ConnectionStrings + AllowedOrigins
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — Problem Details RFC 7807 handler
- `backend/src/SiesaAgents.Application/` — Application layer (FluentValidation package added)
- `backend/src/SiesaAgents.Domain/` — Domain layer (zero dependencies)
- `backend/src/SiesaAgents.Infrastructure/` — Infrastructure layer (Npgsql.EFCore.PostgreSQL added)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — 3 middleware unit tests
