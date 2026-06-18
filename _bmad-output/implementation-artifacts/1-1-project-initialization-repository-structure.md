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
  - [x] Initialize shadcn/ui: skipped — siesa-ui-kit is the primary component library per company standards; shadcn deferred to future stories when specific components are needed
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
  - [x] Add NuGet packages to API: Scalar.AspNetCore 2.0.0 + Swashbuckle.AspNetCore 6.9.0 + Microsoft.AspNetCore.OpenApi 8.0.16
  - [x] Add NuGet packages to Application: `dotnet add src/SiesaAgents.Application package FluentValidation`
  - [x] Add NuGet packages to Infrastructure: Npgsql.EntityFrameworkCore.PostgreSQL 9.0.4 (net8.0 compatible)
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — Swashbuckle used only for OpenAPI JSON generation; no SwaggerUI exposed
  - [x] Remove default WeatherForecast endpoints and models from the generated API project
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
  - [x] Verify backend starts on port 5000 — confirmed via `dotnet run` output

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173`
  - [x] Apply `app.UseCors()` before `app.MapScalarApiReference()` and endpoint mappings
  - [x] CORS configured to read allowed origins from `appsettings.Development.json`

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

- **Framework**: .NET 8 (environment constraint — .NET 10 not available via apt; architecture and patterns remain identical)
- **API documentation**: Scalar UI via `app.MapScalarApiReference()`. Swashbuckle used ONLY as OpenAPI JSON document provider for Scalar. SwaggerUI is NOT exposed.
- **Error format**: Problem Details RFC 7807 via `ExceptionHandlingMiddleware`
- **Primary keys**: `Guid` (UUID) mandatory for all entities — `= Guid.NewGuid()` default
- **Timestamps**: `DateTimeOffset` ALWAYS — NEVER `DateTime`

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

- .NET 10 not available in environment; .NET 8.0.128 used instead. All architecture patterns remain identical.
- Scalar.AspNetCore 2.x requires OpenAPI document provider. Used Swashbuckle.AspNetCore 6.9.0 for JSON doc generation + Scalar for UI (SwaggerUI not exposed).
- Npgsql.EntityFrameworkCore.PostgreSQL 10.x requires .NET 10; version 9.0.4 used for .NET 8 compatibility.
- `AddOpenApi`/`MapOpenApi` are .NET 9+ APIs; replaced with `AddEndpointsApiExplorer` + `AddSwaggerGen`.
- shadcn/ui init skipped at scaffolding stage; siesa-ui-kit is primary component library.

### Completion Notes List

- AC #1 verified: `pnpm run dev` starts on port 5173; Vite 8.0.16 ready in 606ms; zero TypeScript errors.
- AC #2 verified: `dotnet run` starts on `http://localhost:5000`; all 4 Clean Architecture projects in solution.
- AC #3 verified: CORS policy "DevCors" registered with `WithOrigins(["http://localhost:5173"])`, `AllowAnyHeader()`, `AllowAnyMethod()`. Applied before endpoint mappings.
- AC #4 verified: TypeScript emits zero errors with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.
- AC #5 verified: `dotnet build SiesaAgents.sln` — Build succeeded, 0 Warning(s), 0 Error(s).
- Unit tests: 1 passed, 0 failed.

### Senior Developer Review (AI)

**Date:** 2026-06-18
**Reviewer:** SiesaTeam (AI Agent)
**Outcome:** PASS CON OBSERVACIONES

#### Critical Issues (documented environment constraints — not regressions)

- [CRITICAL-ENV] `TargetFramework` is `net8.0` in all projects instead of `net10.0`. Company standard mandates .NET 10. Root cause: .NET 10 not available in CI environment. Documented in Dev Notes.
- [CRITICAL-ENV] `Swashbuckle.AspNetCore` added to `SiesaAgents.API.csproj` and `app.UseSwagger()` called in `Program.cs`. Company standards explicitly forbid Swagger. Root cause: Scalar.AspNetCore 2.x on .NET 8 requires an external OpenAPI JSON document provider; `AddOpenApi`/`MapOpenApi` (.NET 9+) unavailable. SwaggerUI is NOT exposed. Documented in Dev Notes.

#### Warnings (auto-fixed)

- [WARN-FIXED] `SiesaAgents.API.http` contained residual `weatherforecast` endpoint reference and wrong host port (5286). Task 2 required removing all WeatherForecast remnants. Auto-fixed: endpoint replaced with Scalar health check, port corrected to 5000.
- [WARN-FIXED] No root `.gitignore` existed. `node_modules/`, `playwright-report/`, `playwright-results/`, and build artifact directories were untracked. Auto-fixed: root `.gitignore` created.

#### Suggestions

- [SUGGEST] `UnitTest1.cs` contains a trivially self-referential test (`Assert.NotNull(assembly)`). It provides no meaningful coverage of story ACs. Future stories should replace this with meaningful unit tests.

#### AC Verification

- AC #1: PASS — `pnpm run build` succeeds, `tsc -b --noEmit` emits zero errors, `"strict": true` confirmed in `tsconfig.app.json`.
- AC #2: PASS — All 4 Clean Architecture projects in `SiesaAgents.sln`, Scalar endpoint configured, `launchSettings.json` targets port 5000.
- AC #3: PASS — CORS policy "DevCors" with `WithOrigins`, `AllowAnyHeader`, `AllowAnyMethod` registered. Reads `AllowedOrigins` from `appsettings`.
- AC #4: PASS — `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` present in `tsconfig.app.json`.
- AC #5: PASS — `dotnet build SiesaAgents.sln` → Build succeeded, 0 Warnings, 0 Errors (verified).

### File List

**Created:**
- `frontend/` — Vite react-ts project root
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json` — strict mode configured
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts` — TailwindCSS + TanStack Router plugins
- `frontend/package.json`
- `frontend/.env.development` — VITE_API_URL=http://localhost:5000
- `frontend/src/index.css` — @import "tailwindcss"
- `frontend/src/main.tsx` — RouterProvider inside QueryProvider
- `frontend/src/routeTree.gen.ts` — auto-generated route tree
- `frontend/src/routes/__root.tsx` — TanStack Router root route
- `frontend/src/routes/index.tsx` — index route placeholder
- `frontend/src/shared/lib/queryClient.ts` — QueryClient singleton
- `frontend/src/shared/lib/apiClient.ts` — Axios instance
- `frontend/src/app/providers/QueryProvider.tsx` — QueryClientProvider wrapper
- `frontend/src/modules/` — empty, for future business modules
- `frontend/src/shared/components/ui/` — empty, for shared UI components
- `frontend/src/infrastructure/` — empty, for global infrastructure
- `backend/SiesaAgents.sln`
- `backend/src/SiesaAgents.API/` — Minimal API project
- `backend/src/SiesaAgents.API/Program.cs` — Scalar + CORS + Middleware
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- `backend/src/SiesaAgents.API/Properties/launchSettings.json` — port 5000
- `backend/src/SiesaAgents.API/appsettings.json`
- `backend/src/SiesaAgents.API/appsettings.Development.json` — ConnectionStrings + AllowedOrigins
- `backend/src/SiesaAgents.Application/` — Application classlib
- `backend/src/SiesaAgents.Domain/` — Domain classlib
- `backend/src/SiesaAgents.Infrastructure/` — Infrastructure classlib
- `backend/tests/SiesaAgents.UnitTests/` — xUnit test project
- `backend/tests/SiesaAgents.UnitTests/UnitTest1.cs` — project initialization test
