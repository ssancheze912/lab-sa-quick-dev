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
  - [x] Vite react-ts scaffold already present at `frontend/` — aligned dependencies to company standards (React 18, Vite 7, TS 5.7)
  - [x] `tsconfig.app.json` already has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`; removed unsupported `erasableSyntaxOnly` option
  - [x] Installed runtime deps: `@tanstack/react-router`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-loading-skeleton`
  - [x] Installed dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@tanstack/router-plugin`, `@tanstack/router-devtools`, `jsdom`
  - [x] Installed TailwindCSS v4: `tailwindcss`, `@tailwindcss/vite`
  - [ ] `siesa-ui-kit` and shadcn/ui init — DEFERRED: package not available in the offline registry; will be added in Story 1.2 when first UI components are needed (`siesa-ui-kit` Navigation components)
  - [x] Configured `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`, port 5173, `@/*` alias
  - [x] Created `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
  - [x] Created `src/shared/lib/queryClient.ts` exporting singleton `QueryClient` with 60s `staleTime`
  - [x] Created `src/shared/lib/apiClient.ts` — Axios instance reading `VITE_API_URL`, JSON headers, response interceptor stub
  - [x] Created `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Created `src/routes/__root.tsx` as TanStack Router root + `src/routes/index.tsx` placeholder home page
  - [x] Rewrote `src/main.tsx` wiring `RouterProvider` inside `QueryProvider` (removed default App.tsx/App.css)
  - [x] Verified `pnpm run dev` starts on port 5173 (HTTP 200) and `pnpm exec tsc -b` emits zero errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Created `backend/SiesaAgents.sln` with five referenced projects (manually authored — .NET 10 SDK not installed in current environment)
  - [x] Created `src/SiesaAgents.API/SiesaAgents.API.csproj` (Microsoft.NET.Sdk.Web, net10.0)
  - [x] Created `src/SiesaAgents.Application/SiesaAgents.Application.csproj` (classlib net10.0)
  - [x] Created `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` (classlib net10.0)
  - [x] Created `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (classlib net10.0)
  - [x] Created `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (xUnit, net10.0)
  - [x] Added project references: API → Application + Infrastructure; Application → Domain; Infrastructure → Domain; UnitTests → Application + Domain
  - [x] Added NuGet packages: `Scalar.AspNetCore` (API), `Microsoft.AspNetCore.OpenApi` (API for Scalar metadata), `FluentValidation` (Application), `Npgsql.EntityFrameworkCore.PostgreSQL` (Infrastructure), xUnit packages (UnitTests)
  - [x] Authored `Program.cs` using `app.MapScalarApiReference()` (no Swagger anywhere)
  - [x] Did not generate WeatherForecast endpoints — clean `Program.cs` with only Scalar + CORS + ExceptionHandlingMiddleware wiring
  - [ ] `dotnet build SiesaAgents.sln` not executed — DEFERRED: .NET 10 SDK unavailable in current sandbox; project files manually authored to match `dotnet new` template output and will be built by CI / dev machine with SDK installed
  - [ ] Scalar page verification at `/scalar` not executed — DEFERRED: same reason as above

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] Registered `DevCors` policy in `Program.cs` reading origins from `AllowedOrigins` config (default `http://localhost:5173`)
  - [x] `app.UseCors("DevCors")` applied before `app.MapScalarApiReference()`
  - [ ] Browser dev-tools verification deferred until SDK build is run

- [x] Task 4 — Add `ExceptionHandlingMiddleware` stub
  - [x] Created `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807 (no stack traces leaked)
  - [x] Registered `app.UseMiddleware<ExceptionHandlingMiddleware>()` as the first middleware in `Program.cs`

- [x] Task 5 — Configure `appsettings.Development.json`
  - [x] Added `ConnectionStrings:DefaultConnection` = `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
  - [x] Added `AllowedOrigins` array with `http://localhost:5173`

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

- `pnpm exec tsc -b` → exit 0 (zero TypeScript errors, AC #4 satisfied)
- `pnpm run build` → vite build succeeded (251.87 kB / 80.84 kB gzip — within 500 KB budget)
- `pnpm test` → 4/4 tests passing (queryClient + apiClient sanity tests)
- `pnpm run dev` → Vite ready on `http://localhost:5173/` returning HTTP 200 (AC #1 satisfied)

### Completion Notes List

- **Frontend ACs (#1, #4)**: Fully satisfied. Vite 7 dev server runs on port 5173 with zero TS errors under strict mode.
- **Backend ACs (#2, #5)**: Source code, csproj files, and solution file authored to match `dotnet new` templates. **Cannot execute `dotnet build` in current sandbox — .NET 10 SDK is not installed**. CI / a developer machine with .NET 10 SDK must run `dotnet restore && dotnet build SiesaAgents.sln` to fully validate AC #2 and AC #5. All package versions and project structure align with company standards (Scalar instead of Swagger, FluentValidation in Application, Npgsql.EFCore in Infrastructure).
- **AC #3 (CORS)**: Policy configured in `Program.cs`, applied before endpoint mappings. Cannot E2E-test without backend SDK; verified by code inspection.
- **`siesa-ui-kit` & `shadcn/ui`**: Not installed in this story — `siesa-ui-kit` is a private/internal package not resolvable via the public registry, and shadcn `init` requires interactive setup. These are deferred to Story 1.2 where the first navigation/UI components are actually consumed.
- **TS configs**: Removed `erasableSyntaxOnly` from `tsconfig.app.json` and `tsconfig.node.json` (option doesn't exist in TS 5.7). Strict-mode trio (`strict`, `noImplicitAny`, `strictNullChecks`) remains explicitly enabled per AC #4.
- **Removed Vite scaffold files**: `src/App.tsx`, `src/App.css` (replaced by TanStack Router-driven shell). `src/index.css` rewritten to use `@import "tailwindcss"`.
- **ATDD correction iteration 1**: Added `data-testid="app-root"` to (a) `index.html` `#root` div and (b) the wrapper `<div>` inside `src/routes/__root.tsx` so Playwright AC1 visibility selector resolves both pre- and post-hydration. Backend AC3 tests and Firefox/Edge browser runs remain out-of-scope in this sandbox (no .NET 10 SDK, browsers not installed) — infrastructure constraints, not implementation gaps.
- **ATDD correction iteration 2**: Iteration 1 caused Playwright strict-mode violation — `[data-testid="app-root"]` matched 2 elements (the `#root` div and the React wrapper). Removed the attribute from the wrapper `<div>` in `src/routes/__root.tsx`; kept only on the `#root` div in `index.html` so the selector resolves to a unique element. Backend AC3 tests still deferred (.NET 10 SDK unavailable).

### File List

**Frontend (created/modified):**
- `frontend/package.json` — modified (aligned dependencies to company stack: React 18, Vite 7, TS 5.7, TanStack Router/Query, Zustand, Axios, RHF + Zod, Tailwind v4, Vitest + RTL + MSW)
- `frontend/vite.config.ts` — modified (added `@tailwindcss/vite`, `@tanstack/router-plugin/vite`, `@/*` alias, port 5173)
- `frontend/vitest.config.ts` — created
- `frontend/tsconfig.app.json` — modified (removed `erasableSyntaxOnly`)
- `frontend/tsconfig.node.json` — modified (removed `erasableSyntaxOnly`)
- `frontend/.env.development` — created (`VITE_API_URL=http://localhost:5000`)
- `frontend/src/main.tsx` — modified (wires `QueryProvider` + `RouterProvider`)
- `frontend/src/index.css` — modified (`@import "tailwindcss"`)
- `frontend/index.html` — modified (added `data-testid="app-root"` to `#root` for ATDD AC1)
- `frontend/src/routes/__root.tsx` — created (iter 1: added `data-testid="app-root"` to root wrapper `<div>`; iter 2: removed it to fix Playwright strict-mode duplicate-match violation — testid now only on `index.html` `#root`)
- `frontend/src/routes/index.tsx` — created (home placeholder)
- `frontend/src/routeTree.gen.ts` — generated by router plugin
- `frontend/src/app/providers/QueryProvider.tsx` — created
- `frontend/src/shared/lib/queryClient.ts` — created
- `frontend/src/shared/lib/apiClient.ts` — created
- `frontend/src/shared/lib/queryClient.test.ts` — created
- `frontend/src/shared/lib/apiClient.test.ts` — created
- `frontend/src/test/setup.ts` — created
- `frontend/src/App.tsx`, `frontend/src/App.css` — deleted (Vite scaffold defaults)
- `frontend/src/modules/`, `frontend/src/shared/{components/ui,hooks,types,constants}`, `frontend/src/app/{store,config}`, `frontend/src/infrastructure/{api,storage}` — created (empty folders for future stories per Clean Architecture layout)

**Backend (created):**
- `backend/SiesaAgents.sln` — solution file with 5 projects
- `backend/.gitignore`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/src/SiesaAgents.API/Program.cs` — Scalar + CORS + ExceptionHandlingMiddleware
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — RFC 7807 Problem Details
- `backend/src/SiesaAgents.API/Properties/launchSettings.json` — port 5000, launches `/scalar`
- `backend/src/SiesaAgents.API/appsettings.json`
- `backend/src/SiesaAgents.API/appsettings.Development.json` — Postgres connection string + AllowedOrigins
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` + `AssemblyMarker.cs`
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` + `AssemblyMarker.cs`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` + `AssemblyMarker.cs`
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` + `PlaceholderTests.cs` + `Usings.cs`
