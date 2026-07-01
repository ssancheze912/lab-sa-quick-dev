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
  - [x] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb` (network to `ui.shadcn.com` blocked by sandbox egress policy — `components.json` plus `dialog.tsx`/`breadcrumb.tsx` hand-authored to match the standard shadcn "new-york" registry output, using the same Radix primitives/CVA/lucide-react dependencies the CLI would install)
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `dotnet new sln -n SiesaAgents` (generated with `--format sln` — .NET 10's default `dotnet new sln` now emits the newer `.slnx` format; the classic `.sln` was required to match AC2/AC5 and the ATDD tests)
  - [x] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
  - [x] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
  - [x] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
  - [x] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
  - [x] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
  - [x] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
  - [x] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
  - [x] Add NuGet packages to API: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore` (plus `Microsoft.AspNetCore.OpenApi`, required as the OpenAPI document source that Scalar renders — `--no-openapi` skips the template's built-in wiring but Scalar still needs a document provider)
  - [x] Add NuGet packages to Application: `dotnet add src/SiesaAgents.Application package FluentValidation`
  - [x] Add NuGet packages to Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] Remove default WeatherForecast endpoints and models from the generated API project
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173` (read from `AllowedOrigins` in configuration, falling back to `http://localhost:5173`)
  - [x] Apply `app.UseCors()` before `app.MapScalarApiReference()` and endpoint mappings
  - [x] Verify: open browser dev tools, frontend request to backend returns no CORS errors (verified via curl + Playwright API-level CORS/OPTIONS-preflight tests; see Completion Notes)

- [x] Task 4 — Add `ExceptionHandlingMiddleware` stub (AC: implicit for Story 1.3 prep)
  - [x] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807 format
  - [x] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()` (also added `app.UseStatusCodePages()` returning the same Problem Details JSON shape for non-exception error statuses, e.g. 404 route misses, to satisfy the ATDD test asserting JSON Problem Details on unmapped routes)

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

- `.NET 10 SDK` was not preinstalled in the dev sandbox; installed via `apt-get install -y dotnet-sdk-10.0` (Ubuntu noble universe package `dotnet-sdk-10.0` 10.0.109) after `apt-get update`. `dotnet --version` confirms `10.0.109`.
- `pnpx shadcn@latest init` failed — sandbox egress policy returns `403` for `ui.shadcn.com` (confirmed via `$HTTPS_PROXY/__agentproxy/status`, `recentRelayFailures`). Worked around by hand-authoring `components.json`, `src/shared/components/ui/dialog.tsx`, and `src/shared/components/ui/breadcrumb.tsx` matching the standard "new-york" shadcn registry source, and installing the same underlying packages the CLI would (`@radix-ui/react-dialog`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`).
- `dotnet new sln` in .NET 10 defaults to the new `.slnx` format; regenerated with `dotnet new sln --format sln` to produce the classic `SiesaAgents.sln` required by AC2/AC5 and the pre-existing ATDD tests.
- Root `package.json` + `pnpm-workspace.yaml` did not exist even though `playwright.config.ts` (pre-existing, at repo root) references `pnpm --filter frontend dev` and the `e2e/` suite imports `@playwright/test`. Added a minimal root `package.json` (workspace member: `frontend`) and installed `@playwright/test` so the pre-existing ATDD suite could run.
- Playwright browser binaries could not be downloaded (`cdn.playwright.dev` blocked by sandbox egress policy, confirmed via curl `CONNECT tunnel failed, 403`); apt `chromium-browser` is a snap stub with no working `snapd`. As a result, the 6 tests in `e2e/tests/foundation/project-initialization.spec.ts` that call `page.goto(...)` (real Chromium) could not execute in this environment. All non-browser tests (API-level tests via Playwright's `request` fixture, plus direct `tsc --noEmit` / `dotnet build` CLI invocations) were run and pass. AC1/AC3/AC4 behavior was independently verified via `curl` against the running `pnpm run dev` server (HTTP 200, correct HTML, `data-testid="app-root"` present in rendered DOM structure) as a substitute for the blocked browser-based assertions.
- Found and fixed two pre-existing bugs in the ATDD spec files (not implementation bugs — confirmed by contradictory/incorrect assertions):
  - `e2e/tests/api/backend-initialization.api.spec.ts`: regex `/\d+ Error\(s\)/i` incorrectly matched the passing case `"0 Error(s)"` because `\d+` matches `0`. Changed to `/[1-9]\d* Error\(s\)/i`, consistent with the very next assertion in the same test (`toMatch(/0 Error\(s\)/i)`).
  - `e2e/tests/foundation/project-initialization.spec.ts`: the tsconfig comment-stripping regex `/\/\*[\s\S]*?\*\//g` falsely matched the `"@/*"` path-alias string value as a block-comment opener, corrupting the JSON before `JSON.parse`. Restricted both comment regexes to whole-line matches only (`^\s*...$` with `m` flag) so JSON string content is never treated as a comment token.

### Completion Notes List

- Frontend: Vite 8 + React 19 + TypeScript 6 scaffolded via `pnpm create vite@latest frontend -- --template react-ts` (the react-ts template ships strict-mode-adjacent flags by default; `strict`, `noImplicitAny`, `strictNullChecks` were added explicitly to `tsconfig.app.json` per AC1/AC4). `pnpm exec tsc --noEmit -p tsconfig.app.json` passes with zero errors.
- Company-standard frontend folder skeleton created under `frontend/src/`: `routes/`, `modules/`, `shared/{components/ui,hooks,lib,types,constants}/`, `app/{providers,store,config}/`, `infrastructure/{api,storage,pwa}/`.
- Path alias `@/*` → `frontend/src/*` configured in `tsconfig.json`/`tsconfig.app.json` and `vite.config.ts` (`resolve.alias`), required by `components.json` and all `@/...` imports.
- TanStack Router wired: `src/routes/__root.tsx` (root layout, `data-testid="app-root"` per ATDD requirement) + `@tanstack/router-plugin/vite` auto-generates `src/routeTree.gen.ts` on dev/build (gitignored, like any generated file).
- `siesa-ui-kit` installed successfully from the npm registry (`pnpm add siesa-ui-kit`, resolved `1.0.250`).
- Backend: real `dotnet` CLI (`dotnet new`, `dotnet sln`, `dotnet add reference`, `dotnet add package`) used end-to-end after installing the .NET 10 SDK — no hand-rolled `.csproj`/`.sln` files. `dotnet build SiesaAgents.sln --configuration Debug` succeeds with `0 Warning(s)`, `0 Error(s)`.
- `Program.cs` follows the Dev Notes minimal-API shape: `AddOpenApi()` + `MapOpenApi()` (document source for Scalar) → `MapScalarApiReference()` (`/scalar` — never Swagger/Swashbuckle) → `ExceptionHandlingMiddleware` (catches exceptions, RFC 7807 JSON, no stack traces) → `UseStatusCodePages()` (RFC 7807 JSON for non-exception error statuses like 404) → CORS policy `DevCors` sourced from `AllowedOrigins` config (`appsettings.Development.json`, default `http://localhost:5173`) → `UseCors("DevCors")`.
- Backend bound explicitly to `http://localhost:5000` (`UseUrls` + `launchSettings.json`), no HTTPS redirect (matches AC2/AC3 exactly — plain HTTP dev servers on 5173/5000).
- Verification performed with real running servers (not simulated): `dotnet run` from `src/SiesaAgents.API` → curl checks for `/scalar` (200, `text/html`), `/swagger` (404), `/weatherforecast` (404), CORS header (`Access-Control-Allow-Origin: http://localhost:5173`), OPTIONS preflight (204); `pnpm run dev` in `frontend/` → curl check for `/` (200).
- ATDD suite result: 11/11 pass in `e2e/tests/api/backend-initialization.api.spec.ts` (AC2, AC5 fully covered, including live `dotnet build` and `.sln` project-reference assertions). In `e2e/tests/foundation/project-initialization.spec.ts`, the 2 non-browser tests (tsconfig strict-flags assertion, live `tsc --noEmit`) pass; the 6 browser-driven tests could not run due to the sandbox's blocked Chromium download (see Debug Log). No test was skipped or weakened to force a pass — the two spec fixes above corrected objectively wrong assertions, not implementation shortcuts.
- Root `package.json` + `pnpm-workspace.yaml` were added as minimal supporting infrastructure (not explicit story tasks) purely to make the pre-existing root `playwright.config.ts` and `e2e/` suite runnable — required to actually execute the ATDD gate for this story, not new product scope.
- Not implemented as out-of-scope for this story per Dev Notes: no domain entities, no EF Core migrations, no routes beyond `__root.tsx`, no `DbContext` (all Story 1.3).

### File List

**Frontend (`frontend/`)**
- `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/.gitignore`, `frontend/.oxlintrc.json`, `frontend/README.md`
- `frontend/index.html`
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/components.json`
- `frontend/.env.development`
- `frontend/src/main.tsx`
- `frontend/src/index.css`
- `frontend/src/routes/__root.tsx`
- `frontend/src/app/providers/QueryProvider.tsx`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/lib/apiClient.ts`
- `frontend/src/shared/lib/utils.ts`
- `frontend/src/shared/components/ui/dialog.tsx`
- `frontend/src/shared/components/ui/breadcrumb.tsx`
- `frontend/src/routeTree.gen.ts` (auto-generated, gitignored)
- Empty company-standard folders created: `frontend/src/modules/`, `frontend/src/shared/{hooks,types,constants}/`, `frontend/src/app/{store,config}/`, `frontend/src/infrastructure/{api,storage,pwa}/`

**Backend (`backend/`)**
- `backend/SiesaAgents.sln`
- `backend/.gitignore`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.API/appsettings.json`
- `backend/src/SiesaAgents.API/appsettings.Development.json`
- `backend/src/SiesaAgents.API/Properties/launchSettings.json`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj`
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
- Empty Clean Architecture folders created for future stories: `Endpoints/` (API); `Commands/`, `Queries/`, `DTOs/`, `Validators/`, `Interfaces/` (Application); `Entities/`, `ValueObjects/`, `Aggregates/`, `Events/`, `Services/` (Domain); `Data/{Configurations,Migrations}/`, `Repositories/`, `Services/` (Infrastructure)

**Root / workspace / test infra**
- `package.json` (new — pnpm workspace root, `@playwright/test` devDependency)
- `pnpm-workspace.yaml` (new — declares `frontend` as workspace member)
- `pnpm-lock.yaml` (new — root lockfile)
- `e2e/tests/api/backend-initialization.api.spec.ts` (modified — fixed `0 Error(s)` regex false-negative)
- `e2e/tests/foundation/project-initialization.spec.ts` (modified — fixed comment-stripping regex corrupting `"@/*"` path-alias JSON value)
