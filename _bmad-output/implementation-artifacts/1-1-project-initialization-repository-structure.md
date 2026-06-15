# Story 1.1: Project Initialization & Repository Structure

Status: completed

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
  - [x] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `dotnet new sln -n SiesaAgents` (used `--format sln` for classic .sln; .NET 10 default is .slnx)
  - [x] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
  - [x] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
  - [x] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
  - [x] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
  - [x] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
  - [x] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
  - [x] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
  - [x] Add NuGet packages to API: `Scalar.AspNetCore` + `Microsoft.AspNetCore.OpenApi` (required for Scalar metadata)
  - [x] Add NuGet packages to Application: `dotnet add src/SiesaAgents.Application package FluentValidation`
  - [x] Add NuGet packages to Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] Remove default WeatherForecast endpoints and models from the generated API project
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173`
  - [x] Apply `app.UseCors()` before `app.MapScalarApiReference()` and endpoint mappings
  - [x] Verify: OPTIONS preflight from `http://localhost:5173` returns 204 with `Access-Control-Allow-Origin: http://localhost:5173`

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

- Frontend `tsc -b --force` → zero errors, strict mode active.
- `pnpm run dev` → Vite 8 ready on `http://localhost:5173`.
- Backend `dotnet build SiesaAgents.sln` → Build succeeded, 0 warnings, 0 errors.
- `dotnet run` (API) → Kestrel listening on http://localhost:5000.
- `GET /health` → 200 `{"status":"ok"}`.
- `GET /scalar` → 302→200 (Scalar API Reference HTML).
- `GET /openapi/v1.json` → 200 (OpenAPI metadata for Scalar).
- `OPTIONS /health Origin: http://localhost:5173` → 204 with `Access-Control-Allow-Origin: http://localhost:5173`.
- Backend `dotnet test` → 1 passed, 0 failed.
- Frontend `pnpm run test` → 2 passed, 0 failed.

### Completion Notes List

- **ATDD fix iteration 2 (2026-06-15):** Added `data-testid="app-root"` to the React mount `#root` div in `frontend/index.html` to satisfy the AC1 mount-point selector. Added `app.MapFallback(...)` in `backend/src/SiesaAgents.API/Program.cs` emitting RFC 7807 `application/problem+json` for unmatched routes so AC5 Problem Details test passes. Verified: `GET /api/nonexistent-endpoint-for-atdd` → 404 with `Content-Type: application/json` + Problem Details body.
- .NET 10 SDK 10.0.109 used. The new templates default to the XML `.slnx` solution format; the story AC mentions `SiesaAgents.sln`, so the solution was created with `--format sln` for backward compatibility.
- `Microsoft.AspNetCore.OpenApi` package was added alongside `Scalar.AspNetCore` because Scalar reads the OpenAPI document produced by `AddOpenApi()`/`MapOpenApi()`. No Swashbuckle/Swagger middleware is registered.
- Frontend uses Vite 8 / React 19 / TypeScript 6 (latest at the time of execution; the company standard min versions are Vite 7+, React 18+, TS 5+, all satisfied).
- TypeScript path alias `@/*` configured in both `tsconfig.app.json` and `vite.config.ts`. `baseUrl` was omitted because TS 6 deprecates it; `paths` works without it under bundler resolution.
- shadcn/ui was set up manually (config + Dialog + Breadcrumb components) because the `shadcn` CLI requires interactive prompts; the resulting `components.json` and component files match what `shadcn@latest init && add dialog breadcrumb` would produce.
- `siesa-ui-kit@1.0.218` installed but not yet imported — its components will be wired into the navigation shell in Story 1.2.
- Smoke tests added on both sides to confirm the xUnit and Vitest harnesses are operational.

## Senior Developer Review (AI)

**Reviewer:** gaduranb@siesa.com
**Date:** 2026-06-15
**Outcome:** APPROVED WITH CHANGES (auto-fixes applied)

### Verification

- Backend `dotnet build SiesaAgents.sln` → Build succeeded, 0 warnings, 0 errors. (AC5 PASS)
- Backend `dotnet test` → 1 passed, 0 failed.
- Frontend `pnpm run build` → 0 errors. Bundle gzipped 93.94 KB (well under 500 KB budget). (AC1/AC4 PASS)
- Frontend `pnpm run test` → 2 passed, 0 failed.
- `app.MapScalarApiReference()` present, no Swagger middleware. (AC2 PASS)
- CORS policy `DevCors` reads from `AllowedOrigins`, defaults to `http://localhost:5173`. (AC3 PASS)
- All 4 Clean Architecture projects + UnitTests referenced in `SiesaAgents.sln`. (AC2 PASS)
- TypeScript strict flags verified in `tsconfig.app.json`. No `any` in author-written code (only in `routeTree.gen.ts` which is `@ts-nocheck`).

### Findings

**[HIGH] Empty `backend/src/SiesaAgents.API/Endpoints/` not tracked in Git** — Git does not preserve empty directories, so this folder would not exist for a fresh clone. **Auto-fixed:** added `.gitkeep`.

**[HIGH] Backend `Domain/`, `Application/`, `Infrastructure/` projects have no skeleton subfolders** (`Entities/`, `Commands/`, `Repositories/`, `Data/`, etc. per company standards). Not auto-fixed — likely intentional per story scope note ("This story creates the skeleton structure. No domain entities …"); future stories will add these. Flag for tracking.

**[HIGH] No `Shared.Domain`, `Shared.Infrastructure`, `Shared.Common` projects** — Company standards mandate Shared projects with base classes (`AggregateRoot`, `Entity`, `ValueObject`, `BaseRepository`). Not auto-fixed — scope of Story 1.1 is debatable; should be created at the latest in Story 1.3 (DB foundation) and tracked.

**[MED] CORS silently falls back to dev origin if `AllowedOrigins` config is missing** — Original `Program.cs` used `?? new[] { "http://localhost:5173" }` unconditionally. **Auto-fixed:** in non-Development environments, missing config now throws `InvalidOperationException` at startup; Development retains the dev fallback.

**[MED] `appsettings.json` (base) missing `AllowedOrigins` key** — Production environment had no key, so the silent dev fallback applied. **Auto-fixed:** added empty `"AllowedOrigins": []` to base config (combined with the fail-fast above, this forces operators to populate prod origins).

**[MED] `ExceptionHandlingMiddleware` diverges from Dev Notes pattern (primary constructor)** — Implementation uses traditional constructor with logger injection (an improvement over the snippet, since it logs). Not auto-fixed; functionally superior to the doc.

**[LOW] `apiClient.ts` response interceptor was a no-op** — Both branches are axios defaults. **Auto-fixed:** added comment documenting reserved purpose (auth refresh, error normalization, telemetry).

**[LOW] `index.css` declares `font-family: 'Inter'` but no Inter webfont is loaded** — Falls back to system-ui. Not auto-fixed — should be addressed in Story 1.2 (navigation shell) where typography matters. Recommend `@fontsource/inter` (300, 400, 700) per company standard.

**[LOW] Brand color `--primary` is shadcn default (near-black) instead of Siesa Blue `#0e79fd`** — Not auto-fixed — theming should land alongside the navigation shell in Story 1.2.

**[LOW] `SiesaAgents.API.http` not declared in File List** — Generated by `dotnet new webapi`. Minor documentation gap.

**[LOW] Smoke test `Assert.True(true)`** — Acceptable; comment documents intent as placeholder until real domain logic exists.

### Auto-Corrections Applied (this review)

1. `backend/src/SiesaAgents.API/Endpoints/.gitkeep` — created.
2. `frontend/src/shared/lib/apiClient.ts` — interceptor comment added.
3. `backend/src/SiesaAgents.API/appsettings.json` — `"AllowedOrigins": []` key added.
4. `backend/src/SiesaAgents.API/Program.cs` — CORS now fail-fast in non-Development when `AllowedOrigins` is empty; Development retains `http://localhost:5173` fallback.

Post-fix verification: backend build clean (0/0), backend tests 1/1 pass, frontend build clean, bundle still 93.94 KB gzipped.

### Pending Manual Attention

- Track creation of `Shared.Domain` / `Shared.Infrastructure` / `Shared.Common` projects (HIGH).
- Track creation of skeleton subfolders in Domain/Application/Infrastructure (HIGH).
- Inter webfont loading (Story 1.2).
- Siesa Blue (`#0e79fd`) primary brand color in theme (Story 1.2).

### Verdict

**PASS CON OBSERVACIONES** — All five Acceptance Criteria satisfied. Foundation is solid and unblocks Stories 1.2 / 1.3. Two HIGH-severity findings are scope-deferred (skeleton subfolders + Shared projects) and must be addressed in subsequent foundation stories. All other findings auto-fixed or low-impact.

### File List

**Frontend (created/modified):**
- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/vitest.config.ts`
- `frontend/components.json`
- `frontend/index.html`
- `frontend/.env.development`
- `frontend/src/main.tsx`
- `frontend/src/index.css`
- `frontend/src/routeTree.gen.ts` (generated)
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/app/providers/QueryProvider.tsx`
- `frontend/src/shared/lib/apiClient.ts`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/lib/utils.ts`
- `frontend/src/shared/lib/__tests__/utils.test.ts`
- `frontend/src/shared/components/ui/dialog.tsx`
- `frontend/src/shared/components/ui/breadcrumb.tsx`
- `frontend/src/test/setup.ts`
- `frontend/src/modules/.gitkeep`
- `frontend/src/shared/hooks/.gitkeep`
- `frontend/src/shared/types/.gitkeep`
- `frontend/src/shared/constants/.gitkeep`
- `frontend/src/app/store/.gitkeep`
- `frontend/src/app/config/.gitkeep`
- `frontend/src/infrastructure/api/.gitkeep`
- `frontend/src/infrastructure/storage/.gitkeep`

**Backend (created/modified):**
- `backend/SiesaAgents.sln`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.API/SiesaAgents.API.http`
- `backend/src/SiesaAgents.API/appsettings.json`
- `backend/src/SiesaAgents.API/appsettings.Development.json`
- `backend/src/SiesaAgents.API/Properties/launchSettings.json`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.API/Endpoints/` (empty placeholder)
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj`
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
- `backend/tests/SiesaAgents.UnitTests/SmokeTests.cs`
