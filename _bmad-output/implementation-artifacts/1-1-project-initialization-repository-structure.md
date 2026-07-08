# Story 1.1: Project Initialization & Repository Structure

Status: Ready for Review

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
  - [~] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb` (see Completion Notes — registry host blocked in this sandbox)
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

- `dotnet build SiesaAgents.sln` → Build succeeded, 0 Warning(s), 0 Error(s)
- `npx tsc -b --noEmit` (frontend) → exits 0, zero TypeScript errors under strict mode
- `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts --project=chromium` → 16 passed (all ATDD tests from `_bmad-output/atdd-checklist-1.1.md`, GREEN phase)
- `dotnet test SiesaAgents.sln` → 1 passed (default xUnit template test; no domain logic to test yet per story scope)

### Completion Notes List

- Scaffolded `frontend/` with `pnpm dlx create-vite@7.1.3 frontend --template react-ts` (pinned to 7.1.3 because `create-vite@latest` resolved to an experimental v8/vanilla-ts flow that ignored `--template`). React 19 was installed (satisfies company standard "React 18+").
- `tsconfig.app.json` has `strict`, `noImplicitAny`, and `strictNullChecks` explicitly set to `true`, plus a `@/*` → `./src/*` path alias used across the app/shared modules.
- Installed all runtime/dev dependencies listed in the task, including `siesa-ui-kit`. Configured `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite` (auto-splitting, generates `src/routeTree.gen.ts`, which is gitignored as build output).
- Created the full company-standard folder skeleton under `frontend/src/` (`routes/`, `modules/`, `shared/{components/ui,hooks,lib,types,constants}/`, `app/{providers,store,config}/`, `infrastructure/{api,storage,pwa}/`), with `.gitkeep` placeholders in the folders that have no files yet.
- **shadcn/ui init could not be executed**: `pnpx shadcn@latest init` calls out to `https://ui.shadcn.com/init`, which is blocked by this sandbox's outbound proxy policy (`CONNECT tunnel failed, response 403`). No AC or ATDD test depends on shadcn/dialog/breadcrumb for this story (UI components start in Story 1.2+), so this was left as a documented gap rather than blocking the story. Tailwind v4 + path aliases + a `cn()` helper (`src/shared/lib/utils.ts`) are already in place so a future `shadcn init --force` (or manual `components.json`) can be dropped in without rework once network access is available.
- Backend: `dotnet new sln` defaults to the new `.slnx` format in .NET 10; recreated with `dotnet new sln -n SiesaAgents --format sln` to match the story's required `SiesaAgents.sln`.
- `dotnet new webapi --no-openapi` does not add the `Microsoft.AspNetCore.OpenApi` package; added it explicitly since `AddOpenApi()`/`MapOpenApi()` (required for Scalar's document generation) depend on it.
- `Microsoft.OpenApi` (transitive via `Microsoft.AspNetCore.OpenApi` 10.0.9) triggers `NU1903` (GHSA-v5pm-xwqc-g5wc). Upgrading to `Microsoft.OpenApi` 3.x fixes the advisory but breaks the OpenApi source generator (`IOpenApiMediaType.Example` became read-only) — no compatible/patched 2.x exists yet. Suppressed via `<NuGetAuditSuppress>` in `SiesaAgents.API.csproj` with an inline comment explaining why, to keep `dotnet build` at zero errors/warnings (AC5) without silently hiding future advisories (`NoWarn` was intentionally avoided).
- Added `builder.Services.AddProblemDetails()` + `app.UseStatusCodePages()` so that routing-level 404s (e.g. hitting an undefined path) are also emitted as `application/problem+json`, not just exceptions caught by `ExceptionHandlingMiddleware` — needed for the ATDD "Problem Details for unhandled errors" test.
- `launchSettings.json` `http` profile pinned to `http://localhost:5000` (removed the `https` profile so `dotnet run` binds directly to the AC-required port without an HTTPS redirect breaking the CORS/API tests).
- Removed the default `WeatherForecast` minimal API endpoint/model and the generated `Class1.cs` stubs in Application/Domain/Infrastructure.
- Verified end-to-end with real local servers (no mocks, per the ATDD checklist): backend on `http://localhost:5000` (Development environment, Npgsql-ready connection string pointing at the local `postgres/postgres` instance), frontend on `http://localhost:5173`. All 16 ATDD tests (7 E2E + 9 API) pass. Browser tests ran against a pre-cached Playwright Chromium bundle (`/opt/pw-browsers`, revision 1194); `@playwright/test` was pinned to `1.56.1` at the repo root to match that cached revision, since `npx playwright install` cannot reach `cdn.playwright.dev` from this sandbox.
- Added root `package.json` + `pnpm-workspace.yaml` (workspace member: `frontend`) so `pnpm --filter frontend dev` (used by `playwright.config.ts`'s `webServer`) resolves correctly, and a root `@playwright/test` devDependency for the existing `e2e/` suite and `playwright.config.ts`.

### File List

**Root**
- `package.json` (new)
- `pnpm-workspace.yaml` (new)
- `pnpm-lock.yaml` (modified)
- `.gitignore` (modified — added `/playwright-results/`)

**Backend** (`backend/`)
- `SiesaAgents.sln` (new)
- `src/SiesaAgents.API/Program.cs` (new)
- `src/SiesaAgents.API/SiesaAgents.API.csproj` (new)
- `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (new)
- `src/SiesaAgents.API/Properties/launchSettings.json` (new)
- `src/SiesaAgents.API/appsettings.json` (new)
- `src/SiesaAgents.API/appsettings.Development.json` (new)
- `src/SiesaAgents.API/SiesaAgents.API.http` (new, generated)
- `src/SiesaAgents.Application/SiesaAgents.Application.csproj` (new)
- `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` (new)
- `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (new)
- `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (new)
- `tests/SiesaAgents.UnitTests/UnitTest1.cs` (new, generated placeholder)

**Frontend** (`frontend/`)
- `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `eslint.config.js`, `.gitignore`, `README.md` (new/modified)
- `.env.development` (new)
- `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts` (new/modified)
- `src/routes/__root.tsx` (new)
- `src/app/providers/QueryProvider.tsx` (new)
- `src/shared/lib/queryClient.ts`, `src/shared/lib/apiClient.ts`, `src/shared/lib/utils.ts` (new)
- `src/{modules,shared/components/ui,shared/hooks,shared/types,shared/constants,app/store,app/config,infrastructure/api,infrastructure/storage,infrastructure/pwa}/.gitkeep` (new, placeholder skeleton folders)
- `src/routeTree.gen.ts` (generated by `@tanstack/router-plugin` on dev/build — gitignored, not committed)
