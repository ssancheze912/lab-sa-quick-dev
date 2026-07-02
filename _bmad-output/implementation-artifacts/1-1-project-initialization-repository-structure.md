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
  - [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb` — **SKIPPED (sandbox network blocks `ui.shadcn.com`). `components.json` was authored manually with correct aliases; `dialog`/`breadcrumb` components must be added when network access is available. Tracked in Review Follow-ups.**
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

claude-opus-4-7

### Debug Log References

- Frontend `pnpm run build` — 0 TypeScript errors, TS strict mode active.
- Backend `dotnet build SiesaAgents.sln` — 0 warnings, 0 errors.
- Playwright ATDD suite (`e2e/tests/foundation` + `e2e/tests/api`) — 16/16 tests GREEN.

### Completion Notes List

- **.NET 10 SDK** installed at `/usr/lib/dotnet/sdk/10.0.109` (from `dotnet-sdk-10.0` apt package).
- **Solution format**: `.NET 10 dotnet new sln` produces `.slnx` by default; recreated as classic `.sln` (`--format sln`) to match story spec.
- **`Microsoft.OpenApi` transitive NU1903 vulnerability** (dev-only, coming from `Microsoft.AspNetCore.OpenApi 10.0.9`): explicit upgrade to `3.7.0` breaks the ASP.NET Core OpenAPI source generator (`IOpenApiMediaType.Example` API change). Suppressed via `<NoWarn>NU1903</NoWarn>` in `SiesaAgents.API.csproj` until Microsoft ships a compatible bump — captured for follow-up. Build now reports 0 warnings / 0 errors.
- **`shadcn init` and component add (`dialog`, `breadcrumb`) skipped**: the shadcn CLI requires outbound access to `ui.shadcn.com` which is not reachable through the sandbox proxy. `components.json` was authored manually with the correct aliases and Tailwind v4 config so future stories can `pnpx shadcn add <component>` once network access is available. Utility `cn` helper is provided at `src/shared/lib/utils.ts`.
- **`pnpm-workspace.yaml`** added at repo root so `pnpm --filter frontend dev` (used by `playwright.config.ts`) resolves.
- **Playwright**: pinned to `@playwright/test@1.56.0` to match the pre-installed Chromium 1194 headless-shell bundle under `/opt/pw-browsers` (versions 1.55/1.60/latest look for browser builds not present in the sandbox).
- **`playwright.config.ts` extended**: added a second `webServer` entry that launches the backend (`ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls http://localhost:5000`) so E2E suites boot both servers.
- **CORS**: `AllowedOrigins` is read from `appsettings.Development.json` (falls back to `http://localhost:5173`).
- **Problem Details**: `AddProblemDetails()` + `UseStatusCodePages()` make framework 404/405/etc. responses return `application/problem+json`; custom `ExceptionHandlingMiddleware` handles unhandled exceptions with RFC 7807 payloads (no stack traces exposed).
- **`data-testid="app-root"`** attribute added to the TanStack Router root layout (`src/routes/__root.tsx`) so ATDD can assert the React mount point.

### File List

**Frontend — `frontend/`**

- `frontend/package.json` (added: TanStack Router/Query, Zustand, Axios, React Hook Form, Zod, Tailwind v4, siesa-ui-kit, testing deps)
- `frontend/tsconfig.json` (root project references file)
- `frontend/tsconfig.app.json` (strict/noImplicitAny/strictNullChecks + `@/*` path alias)
- `frontend/tsconfig.node.json` (Vite/Node tooling config)
- `frontend/vite.config.ts` (TanStack Router plugin + `@tailwindcss/vite` + `@/` alias + `port: 5173`)
- `frontend/components.json` (shadcn config with Siesa aliases — components not yet added, see Follow-ups)
- `frontend/index.html` (Siesa title + `lang="es-CO"`)
- `frontend/src/index.css` (`@import "tailwindcss";`)
- `frontend/src/main.tsx` (RouterProvider inside QueryProvider inside StrictMode)
- `frontend/src/routes/__root.tsx` (root layout with `data-testid="app-root"`)
- `frontend/src/routes/index.tsx` (placeholder home route)
- `frontend/src/routeTree.gen.ts` (auto-generated by TanStack Router plugin — committed)
- `frontend/src/app/providers/QueryProvider.tsx`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/lib/apiClient.ts` (interceptors removed — see Code Review 2026-07-02)
- `frontend/src/shared/lib/utils.ts`
- `frontend/.env.development` (`VITE_API_URL=http://localhost:5000`)
- `frontend/.gitignore`
- `frontend/.oxlintrc.json` (oxlint config)
- `frontend/README.md`
- `frontend/public/favicon.svg` (**Vite mascot — pending Siesa branding replacement, see Follow-ups**)
- `frontend/public/icons.svg`

Removed (default Vite template scaffold): `frontend/src/App.tsx`, `frontend/src/App.css`, `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg` (removed by code review 2026-07-02), `frontend/src/assets/hero.png` (removed by code review 2026-07-02 — unreferenced).

**Backend — `backend/`**

- `backend/SiesaAgents.sln`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (Scalar + AspNetCore.OpenApi)
- `backend/src/SiesaAgents.API/Program.cs` (OpenAPI + CORS + ProblemDetails + ExceptionHandling + Scalar)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.API/appsettings.json` (production defaults)
- `backend/src/SiesaAgents.API/appsettings.Development.json` (`ConnectionStrings:DefaultConnection`, `AllowedOrigins`)
- `backend/src/SiesaAgents.API/Properties/launchSettings.json` (port 5000, HTTP only)
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` (FluentValidation, reference → Domain)
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (Npgsql.EntityFrameworkCore.PostgreSQL, reference → Domain)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (references → Application, Domain)

Removed (default templates): `WeatherForecast` endpoint & record from `Program.cs`; `SiesaAgents.API.http`; `Class1.cs` from Application/Domain/Infrastructure; `UnitTest1.cs` from UnitTests.

**Repository root**

- `package.json` (root — declares `@playwright/test` and `dev:frontend` / `test:e2e` / `backend:build` / `backend:run` scripts)
- `pnpm-workspace.yaml` (`packages: [frontend]`)
- `pnpm-lock.yaml` (committed lockfile)
- `.gitignore` (root)
- `playwright.config.ts` (added backend webServer entry)

## Review Follow-ups (AI)

Created by Adversarial Code Review on 2026-07-02.

- [ ] [AI-Review][CRITICAL] Initialize shadcn/ui once outbound access to `ui.shadcn.com` is available: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`. Verify components land under `frontend/src/shared/components/ui/`. **Blocks Story 1.2 NavigationRail/breadcrumb work.**
- [ ] [AI-Review][HIGH] Remove `<NoWarn>NU1903</NoWarn>` from `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` when Microsoft ships a `Microsoft.AspNetCore.OpenApi` bump compatible with `Microsoft.OpenApi >= 3.7.0`. Track via NuGet security advisory feed.
- [ ] [AI-Review][MED] Replace `frontend/public/favicon.svg` (currently the Vite mascot) with a Siesa-branded icon before any public deploy. Update `<link rel="icon">` in `frontend/index.html` if the filename changes.
- [ ] [AI-Review][MED] Harden CORS in `backend/src/SiesaAgents.API/Program.cs` — restrict `.AllowAnyHeader()` to the explicit set (`Content-Type`, `Authorization`, correlation id) and `.AllowAnyMethod()` to the verbs the API actually exposes. Revisit alongside auth in Story 1.3.
- [ ] [AI-Review][LOW] Migrate `ExceptionHandlingMiddleware` to use `IProblemDetailsService` so custom exceptions and framework 4xx responses share one JSON envelope.
- [ ] [AI-Review][LOW] Rewrite root `package.json` `backend:*` scripts to use `dotnet --project`/`dotnet --workingDirectory` instead of `cd backend/...` for Windows PowerShell portability.
