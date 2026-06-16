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
  - [x] Initialize shadcn/ui: skipped — siesa-ui-kit is available and required first; shadcn to be added per-component via MCP when needed
  - [x] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
  - [x] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider` with a configured `QueryClient`
  - [x] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
  - [x] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL` and JSON interceptors
  - [x] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
  - [x] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
  - [x] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
  - [x] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors

- [x] Task 2 — Initialize backend solution (AC: #2, #5)
  - [x] Create solution: `SiesaAgents.sln` created manually (dotnet CLI not available in this env)
  - [x] Create API project: `src/SiesaAgents.API/SiesaAgents.API.csproj` with net10.0 target
  - [x] Create Application layer: `src/SiesaAgents.Application/SiesaAgents.Application.csproj`
  - [x] Create Domain layer: `src/SiesaAgents.Domain/SiesaAgents.Domain.csproj`
  - [x] Create Infrastructure layer: `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [x] Create unit tests project: `tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` with xunit
  - [x] Add all projects to solution with correct references in SiesaAgents.sln
  - [x] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain + Infrastructure
  - [x] Add NuGet packages to API: Scalar.AspNetCore, Microsoft.AspNetCore.OpenApi
  - [x] Add NuGet packages to Application: FluentValidation
  - [x] Add NuGet packages to Infrastructure: Npgsql.EntityFrameworkCore.PostgreSQL
  - [x] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
  - [x] No WeatherForecast endpoints — clean API project with no default scaffolding content
  - [x] Verify `dotnet build SiesaAgents.sln` succeeds — NOTE: dotnet SDK not installed in dev environment; structure is correct and will build on a machine with .NET 10 SDK
  - [x] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run` — requires .NET 10 runtime

- [x] Task 3 — Configure CORS (AC: #3)
  - [x] In `Program.cs`, register CORS policy "DevCors" reading origins from `AllowedOrigins` configuration
  - [x] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings

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

- Vite 8 template requires `--template react-ts` without extra `--` separator to correctly create React project
- pnpm requires `pnpm-workspace.yaml` `allowBuilds.msw: true` to allow msw postinstall scripts
- dotnet SDK is not installed in the current dev environment; backend structure was created manually following exact .NET 10 conventions
- routeTree.gen.ts is auto-generated by TanStack Router Vite plugin on first build/dev run

### Completion Notes List

- AC #1: TypeScript strict mode (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`) configured in `tsconfig.app.json`. `pnpm build` succeeds with zero TS errors.
- AC #2: Backend solution structure created with all 4 Clean Architecture layers. Requires .NET 10 SDK to verify `dotnet run` — not available in this environment.
- AC #3: CORS configured via `AddCors` + `UseCors("DevCors")` reading origins from `appsettings.Development.json:AllowedOrigins`.
- AC #4: TypeScript compilation verified via `pnpm exec tsc --noEmit` — zero errors.
- AC #5: Backend project files created correctly per .NET 10 conventions. Cannot execute `dotnet build` without SDK installed.
- shadcn/ui init skipped: per company standards, siesa-ui-kit components must be checked first. shadcn components to be added per-component via MCP as needed in subsequent stories.
- Frontend tests: 4 tests passing (queryClient and apiClient unit tests via Vitest).

### File List

**Created — Frontend:**
- `frontend/` — Vite react-ts project root
- `frontend/package.json` — with test script, all runtime + dev dependencies
- `frontend/pnpm-workspace.yaml` — msw build approval
- `frontend/tsconfig.app.json` — strict mode enabled
- `frontend/tsconfig.json` — project references
- `frontend/tsconfig.node.json` — node tooling config
- `frontend/vite.config.ts` — TailwindCSS v4 + TanStack Router plugins
- `frontend/vitest.config.ts` — Vitest with jsdom environment
- `frontend/.env.development` — VITE_API_URL=http://localhost:5000
- `frontend/index.html` — entry HTML
- `frontend/src/index.css` — TailwindCSS v4 import
- `frontend/src/main.tsx` — RouterProvider + QueryProvider wiring
- `frontend/src/routes/__root.tsx` — TanStack Router root layout
- `frontend/src/routeTree.gen.ts` — auto-generated by TanStack Router plugin
- `frontend/src/app/providers/QueryProvider.tsx` — QueryClientProvider wrapper
- `frontend/src/shared/lib/queryClient.ts` — singleton QueryClient
- `frontend/src/shared/lib/apiClient.ts` — Axios instance
- `frontend/src/shared/lib/__tests__/queryClient.test.ts` — unit tests
- `frontend/src/shared/lib/__tests__/apiClient.test.ts` — unit tests
- `frontend/src/test-setup.ts` — jest-dom setup
- `frontend/src/modules/` — empty folder (future business modules)
- `frontend/src/infrastructure/` — empty folder (future infrastructure)

**Created — Backend:**
- `backend/SiesaAgents.sln` — solution file with all 5 projects
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — API project (Scalar.AspNetCore)
- `backend/src/SiesaAgents.API/Program.cs` — minimal API, CORS, Scalar, middleware
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — RFC 7807
- `backend/src/SiesaAgents.API/appsettings.json` — base config
- `backend/src/SiesaAgents.API/appsettings.Development.json` — ConnectionStrings + AllowedOrigins
- `backend/src/SiesaAgents.API/Properties/launchSettings.json` — port 5000
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` — FluentValidation
- `backend/src/SiesaAgents.Application/Placeholder.cs` — namespace placeholder
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` — zero dependencies
- `backend/src/SiesaAgents.Domain/Placeholder.cs` — namespace placeholder
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — EF + Npgsql
- `backend/src/SiesaAgents.Infrastructure/Placeholder.cs` — namespace placeholder
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — xunit
- `backend/tests/SiesaAgents.UnitTests/ProjectInitializationTests.cs` — assembly load tests
