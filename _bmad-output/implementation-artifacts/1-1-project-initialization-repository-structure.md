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

- Backend final build: `dotnet build SiesaAgents.sln` → 0 warning, 0 error (10.37s first build, 3.07s incremental)
- Backend tests: `dotnet test SiesaAgents.sln` → 5/5 passed
- Frontend type check: `pnpm exec tsc -b --force` → 0 errors
- Frontend tests: `pnpm test` → 4/4 passed (2 test files)
- Frontend dev server: `pnpm dev` → http://localhost:5173/ HTTP 200
- Backend run: `dotnet run --no-build` → http://localhost:5000 listening
  - `GET /health` → HTTP 200
  - `GET /scalar` → HTTP 302 → `/scalar/` HTTP 200 (Scalar HTML payload confirmed)
  - `OPTIONS /health` with `Origin: http://localhost:5173` → `Access-Control-Allow-Origin: http://localhost:5173`

### Completion Notes List

1. **Vite template versions** — `pnpm create vite@latest` scaffolded React 19.2.7 + TypeScript 6.0.3 + Vite 8.0.16. All satisfy the company-standards minimums (React 18+, TS 5+, Vite 7+).
2. **TypeScript 6 deprecation** — TypeScript 6 deprecates `baseUrl` when `paths` is used; removed `baseUrl` from `tsconfig.app.json` and `tsconfig.json` to avoid `TS5101` errors while keeping the `@/*` path alias functional.
3. **.NET 10 solution file format** — `dotnet new sln -n SiesaAgents` in .NET 10 creates `SiesaAgents.slnx` (the new XML solution format) by default. To honor AC #5 literally (`dotnet build SiesaAgents.sln`), generated the legacy `.sln` explicitly with `dotnet new sln -n SiesaAgents --format sln`. Both formats build identically; future commands can use either.
4. **Scalar.AspNetCore 2.x requires OpenAPI metadata** — Added `Microsoft.AspNetCore.OpenApi` package since the API was scaffolded with `--no-openapi`. `Program.cs` now calls `builder.Services.AddOpenApi()` + `app.MapOpenApi()` so Scalar can render the schema. **No Swashbuckle/Swagger packages were added** (per company standards).
5. **Scalar URL** — `/scalar` returns HTTP 302 → `/scalar/` (HTTP 200). This is Scalar's default routing behavior; AC #2 is satisfied because the page loads at the `/scalar` route.
6. **ExceptionHandlingMiddleware ContentType** — `HttpResponse.WriteAsJsonAsync(value)` overwrites `Response.ContentType` to `application/json`. Used the overload `WriteAsJsonAsync(value, options: null, contentType: "application/problem+json")` so RFC 7807 content type is preserved (verified by unit test).
7. **shadcn/ui registry blocked in sandbox** — `pnpm dlx shadcn@latest add dialog breadcrumb` failed with HTTP 403 against `ui.shadcn.com/r/*` (Cloudflare blocked egress from this environment). Implemented `dialog` and `breadcrumb` manually under `src/shared/components/ui/` following the canonical shadcn-ui templates and the `components.json` config (style: new-york, baseColor: slate). Required transitive deps installed manually: `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`.
8. **CORS configuration** — Policy reads `AllowedOrigins` from `appsettings.Development.json`, with `http://localhost:5173` as the configured value and as the fallback default. Verified via OPTIONS preflight that the `Access-Control-Allow-Origin` header is returned correctly.
9. **`Program` partial class** — Added `public partial class Program;` at the end of `Program.cs` so the test project can use `WebApplicationFactory<Program>` for in-process integration testing (`ApiSmokeTests`).
10. **`siesa-ui-kit` import** — `siesa-ui-kit/styles.css` is imported in `src/main.tsx` per the env-readiness step's UI Kit Enforcement rule.

### File List

**Created — Frontend (`frontend/`)**:
- `package.json` (Vite-generated, then enriched with dependencies and test scripts)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (strict mode enabled, `@/*` path alias)
- `vite.config.ts` (TanStack Router plugin + Tailwind v4 plugin + React plugin)
- `vitest.config.ts`, `vitest.setup.ts`
- `components.json` (shadcn config)
- `.env.development` (`VITE_API_URL=http://localhost:5000`)
- `index.html`
- `src/main.tsx` (RouterProvider inside QueryProvider; siesa-ui-kit styles import)
- `src/index.css` (`@import "tailwindcss";`)
- `src/routes/__root.tsx`, `src/routes/index.tsx`
- `src/routeTree.gen.ts` (auto-generated by router plugin)
- `src/app/providers/QueryProvider.tsx`
- `src/shared/lib/queryClient.ts`, `src/shared/lib/apiClient.ts`, `src/shared/lib/utils.ts`
- `src/shared/lib/queryClient.test.ts`, `src/shared/lib/apiClient.test.ts`
- `src/shared/components/ui/dialog.tsx`, `src/shared/components/ui/breadcrumb.tsx`
- Empty Clean Architecture folders: `src/modules/`, `src/app/store/`, `src/app/config/`, `src/shared/components/`, `src/shared/hooks/`, `src/shared/types/`, `src/shared/constants/`, `src/infrastructure/api/`, `src/infrastructure/storage/`, `src/infrastructure/pwa/`

**Created — Backend (`backend/`)**:
- `SiesaAgents.sln` (legacy format, satisfies AC #5)
- `.gitignore`
- `src/SiesaAgents.API/SiesaAgents.API.csproj` (references Application + Infrastructure; packages: Scalar.AspNetCore, Microsoft.AspNetCore.OpenApi)
- `src/SiesaAgents.API/Program.cs` (Minimal API + Scalar + CORS + ExceptionHandlingMiddleware; exposes `partial class Program`)
- `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (RFC 7807 Problem Details)
- `src/SiesaAgents.API/appsettings.json`
- `src/SiesaAgents.API/appsettings.Development.json` (`ConnectionStrings:DefaultConnection`, `AllowedOrigins`)
- `src/SiesaAgents.API/Properties/launchSettings.json` (HTTP profile on port 5000)
- `src/SiesaAgents.Application/SiesaAgents.Application.csproj` (references Domain; package: FluentValidation)
- `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` (zero dependencies)
- `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (references Domain; package: Npgsql.EntityFrameworkCore.PostgreSQL)
- `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (references API + Application + Domain; package: Microsoft.AspNetCore.Mvc.Testing)
- `tests/SiesaAgents.UnitTests/ApiSmokeTests.cs` (health endpoint, Scalar page reachability, CORS preflight)
- `tests/SiesaAgents.UnitTests/ExceptionHandlingMiddlewareTests.cs` (Problem Details 500, no sensitive leakage, happy-path passthrough)
- Empty Clean Architecture folders per the standards: `Application/{Commands,Queries,DTOs,Validators,Interfaces}`, `Domain/{Entities,ValueObjects,Aggregates,Events,Services}`, `Infrastructure/{Data/Configurations,Data/Migrations,Repositories,Services}`, `API/Endpoints`

**Removed (defaults)**:
- `frontend/src/App.tsx`, `frontend/src/App.css`, `frontend/src/assets/react.svg`, `frontend/src/assets/hero.png`
- `backend/src/SiesaAgents.API/SiesaAgents.API.http`
- Default `Class1.cs` files from Application/Domain/Infrastructure
- Default `UnitTest1.cs` from UnitTests

**Modified**:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (`1-1-...: ready-for-dev` → `review`)

### ATDD Infrastructure Fix Round (attempt 2/3)

Fixed the Playwright test infrastructure so the ATDD acceptance tests can run in the sandbox. No story behavior changed; only test scaffolding and one small API fix.

1. **Playwright browser version mismatch** — the sandbox ships `/opt/pw-browsers/chromium-1194` (Chromium 141) but `@playwright/test@1.60.0` expects chromium-1223 which cannot be downloaded (CDN blocked: `cdn.playwright.dev` 403 "Host not in allowlist"). Pinned `@playwright/test` to `1.56.0` (matches chromium-1194) in the root `package.json`. Firefox is not present in the sandbox, so tests must be run with `--project=chromium`.
2. **pnpm workspace registration** — confirmed `pnpm-workspace.yaml` (`packages: ['frontend']`) exists; ran `pnpm install` at the repo root so `pnpm --filter frontend dev` resolves correctly inside `playwright.config.ts > webServer`.
3. **`playwright.config.ts` webServer is an array** — backend (`dotnet run --project backend/src/SiesaAgents.API --no-launch-profile --urls http://localhost:5000`) gated on `GET /health`, frontend (`pnpm --filter frontend dev`) gated on `GET /`. Both auto-start when the test runner boots.
4. **404 Problem Details (RFC 7807)** — `Program.cs` now calls `AddProblemDetails()` and `UseStatusCodePages(...)` to emit JSON `application/problem+json` for unmapped routes. This satisfies the ATDD test that asserts `/api/nonexistent-endpoint-for-atdd` returns 404 with a JSON content-type (the `ExceptionHandlingMiddleware` only catches exceptions; the 404 path bypasses it). Backend build + xUnit tests (5/5) still green.

**Verification**: `pnpm exec playwright test --project=chromium e2e/tests/foundation e2e/tests/api` → 16/16 passed (10.2s).
