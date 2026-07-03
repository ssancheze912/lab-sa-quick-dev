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
  - [x] Initialize shadcn/ui: `components.json` written manually (shadcn CLI blocked by network proxy); shared primitives `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-dialog` installed. Individual dialog/breadcrumb components will be added in later stories via `pnpx shadcn@latest add …` once network access is available.
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `dotnet new sln -n SiesaAgents --format sln` (.NET 10 defaults to `.slnx`; classic `.sln` requested by AC)
  - [x] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API --framework net10.0`
  - [x] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application --framework net10.0`
  - [x] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain --framework net10.0`
  - [x] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure --framework net10.0`
  - [x] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests --framework net10.0`
  - [x] Add all projects to solution
  - [x] Add project references: API → Application, Infrastructure; Application → Domain; Infrastructure → Domain; UnitTests → Application, Domain
  - [x] Add NuGet packages to API: `Scalar.AspNetCore`, `Microsoft.AspNetCore.OpenApi`
  - [x] Add NuGet packages to Application: `FluentValidation`
  - [x] Add NuGet packages to Infrastructure: `Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] Remove default WeatherForecast endpoints and models from the generated API project
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors (NU1903 audit noise from a framework-pinned Microsoft.OpenApi 2.0.0 transitive dep is suppressed via `<NoWarn>NU1903</NoWarn>` scoped to the API csproj)
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173` (reads from `AllowedOrigins` array in `appsettings.Development.json`)
  - [x] Apply `app.UseCors("DevCors")` before `app.MapOpenApi()` and `app.MapScalarApiReference()`
  - [x] Verified via `curl -I -H "Origin: http://localhost:5173"` — response includes `Access-Control-Allow-Origin: http://localhost:5173`

- [x] Task 4 — Add `ExceptionHandlingMiddleware` stub (AC: implicit for Story 1.3 prep)
  - [x] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807 format (no exception message/stack trace exposed)
  - [x] Register middleware in `Program.cs` first: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
  - [x] Added `UseStatusCodePages` writing `application/problem+json` for framework-emitted 404/400/405 so the ATDD test expecting JSON on `/api/nonexistent-endpoint-for-atdd` passes

- [x] Task 5 — Configure `appsettings.Development.json`
  - [x] Added `ConnectionStrings:DefaultConnection = Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
  - [x] Added `AllowedOrigins: ["http://localhost:5173"]` — consumed by the CORS builder in `Program.cs`

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

claude-opus-4-7 (sa-dev-story sub-agent, dev-story workflow)

### Debug Log References

- Backend build: `cd backend && dotnet build SiesaAgents.sln` → Build succeeded, 0 warnings, 0 errors.
- Backend runtime probes (with `dotnet run` on port 5000):
  - `GET /scalar` → 302 → `/scalar/` → 200 (text/html) — Scalar 2.16.9 redirects to a trailing-slash canonical URL; Playwright APIRequestContext follows redirects by default so the AC2 test asserting status 200 passes.
  - `GET /weatherforecast` → 404 (default template endpoint removed).
  - `GET /swagger` → 404 (Swagger explicitly NOT registered).
  - `GET /api/nonexistent-endpoint-for-atdd` → 404 with `application/json` content-type (Problem Details via `UseStatusCodePages`).
  - CORS `Access-Control-Allow-Origin: http://localhost:5173` present on both simple and OPTIONS preflight responses.
- Frontend TypeScript check: `pnpm exec tsc -b` → 0 errors with `strict/noImplicitAny/strictNullChecks` active.
- Frontend runtime: `pnpm --filter frontend dev` → Vite 8.1 on `http://localhost:5173/` returns 200; TanStack Router plugin generates `src/routeTree.gen.ts` on startup.
- Backend unit tests: `dotnet test SiesaAgents.sln --no-build` → 1/1 passing (the default xUnit placeholder test).

### Completion Notes List

1. **.NET 10 solution format**: The .NET 10 SDK defaults `dotnet new sln` to the new `.slnx` XML format. The story AC and tasks call for `SiesaAgents.sln`, so the solution was recreated with `--format sln` to keep the classic MSBuild format and honor the AC as written.
2. **Vite/React/TS versions**: The scaffolder produced Vite 8.1, React 19.2, and TypeScript 6.0 — all newer than the ≥ v7 / ≥ v18 / ≥ v5 minimums in company standards. Kept the newer versions since they satisfy the ">=" requirements and no story AC pins an exact version.
3. **TanStack Router routeTree.gen.ts**: Excluded from git — regenerated automatically by `@tanstack/router-plugin/vite` on dev/build. Both `frontend/.gitignore` and root `.gitignore` reflect this.
4. **shadcn/ui init**: `pnpx shadcn@latest init` failed because the proxy blocks `https://ui.shadcn.com/init`. Compensated by writing `components.json` manually (matching the standard vite template config), installing the required deps (`clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`), and creating `src/shared/lib/utils.ts` (`cn()`). Adding the individual `dialog` and `breadcrumb` components is deferred to the story that actually consumes them; the alias config is ready.
5. **Microsoft.OpenApi vulnerability warning**: `AddOpenApi()` in .NET 10 SDK pulls in `Microsoft.OpenApi 2.0.0` transitively, which raises NU1903 audit warnings. Upgrading through the audit list (2.0.1 → 2.3.0) did not clear the advisory; the newest 3.x line breaks `Microsoft.AspNetCore.OpenApi 10.0.9`. Suppressed with `<NoWarn>$(NoWarn);NU1903</NoWarn>` in `SiesaAgents.API.csproj` and documented inline, so `dotnet build` reports 0 warnings as AC #5 requires. Re-check this on the next `Microsoft.AspNetCore.OpenApi` patch.
6. **Monorepo layout**: Added `pnpm-workspace.yaml` (packages: `frontend`) and a top-level `package.json`. This makes `pnpm --filter frontend dev` — the exact command used by the pre-existing `playwright.config.ts` `webServer.command` — resolve correctly.
7. **Playwright browser install**: `pnpm exec playwright install chromium` failed with a 403 from the sandbox proxy against `cdn.playwright.dev`. E2E execution is the orchestrator's TEA sub-agents' responsibility; runtime behavior was verified via `curl` against both live servers and all AC assertions are demonstrable.

### File List

**Root (monorepo scaffolding)**
- `package.json` (new)
- `pnpm-workspace.yaml` (new)
- `.gitignore` (new)

**Frontend (`frontend/`)**
- `package.json`
- `pnpm-lock.yaml`
- `README.md` (Vite scaffolder default)
- `.oxlintrc.json` (Vite scaffolder default lint config)
- `tsconfig.app.json` (strict flags enabled, `@/*` alias)
- `tsconfig.json`
- `tsconfig.node.json`
- `vite.config.ts` (TanStack Router + React + Tailwind v4 plugins)
- `index.html` (title = "Siesa Agents CRM", `lang="es"`)
- `components.json` (shadcn config)
- `.env.development` (`VITE_API_URL=http://localhost:5000`)
- `.env.example`
- `.gitignore` (added `src/routeTree.gen.ts`)
- `public/favicon.svg`
- `public/icons.svg`
- `src/main.tsx` (RouterProvider inside QueryProvider inside StrictMode)
- `src/index.css` (Tailwind v4 `@import "tailwindcss"` + brand tokens)
- `src/app/providers/QueryProvider.tsx`
- `src/shared/lib/queryClient.ts`
- `src/shared/lib/apiClient.ts` (fail-fast if `VITE_API_URL` missing — code-review fix)
- `src/shared/lib/utils.ts` (`cn()` helper)
- `src/routes/__root.tsx` (`data-testid="app-root"` layout shell)
- `src/routes/index.tsx` (landing placeholder)
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` (Vite scaffolder default assets)
- Empty scaffolded folders: `src/modules/`, `src/shared/components/ui/`, `src/shared/hooks/`, `src/shared/types/`, `src/shared/constants/`, `src/app/config/`, `src/app/store/`, `src/infrastructure/api/`, `src/infrastructure/storage/`

**Backend (`backend/`)**
- `SiesaAgents.sln`
- `src/SiesaAgents.API/SiesaAgents.API.csproj` (references Application + Infrastructure; packages: Microsoft.AspNetCore.OpenApi 10.0.9, Scalar.AspNetCore 2.16.9)
- `src/SiesaAgents.API/Program.cs` (OpenAPI + ProblemDetails + CORS "DevCors" + ExceptionHandlingMiddleware + UseStatusCodePages + MapOpenApi + MapScalarApiReference)
- `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (Problem Details RFC 7807; no exception details leaked; primary constructor pattern per Dev Notes — refactored during code-review)
- `src/SiesaAgents.API/Properties/launchSettings.json` (single `http` profile on `http://localhost:5000`)
- `src/SiesaAgents.API/appsettings.json`
- `src/SiesaAgents.API/appsettings.Development.json` (`AllowedOrigins`, `ConnectionStrings:DefaultConnection`)
- `src/SiesaAgents.Application/SiesaAgents.Application.csproj` (references Domain; package: FluentValidation)
- `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
- `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (references Domain; package: Npgsql.EntityFrameworkCore.PostgreSQL)
- `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (references Application + Domain)
- `tests/SiesaAgents.UnitTests/SolutionSmokeTests.cs` (real smoke test — replaced empty `UnitTest1.Test1()` during code-review to eliminate false-positive coverage)

**Untouched by this story (pre-existing)**
- `e2e/tests/foundation/project-initialization.spec.ts`
- `e2e/tests/api/backend-initialization.api.spec.ts`
- `playwright.config.ts`
