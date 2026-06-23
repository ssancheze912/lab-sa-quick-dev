# Story 1.1: Project Initialization & Repository Structure

Status: ready-for-dev

## Story

As a developer,
I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
so that the team has a working development environment with both servers running.

## Acceptance Criteria

1. **AC1 (Frontend Server):** Given a clean development machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `npm run dev` starts the Vite server on port 5173 with no errors and the app compiles with TypeScript strict mode enabled.

2. **AC2 (Backend Server):** Given the backend project has been created, when the developer runs `dotnet run` in SiesaAgents.API, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`, and the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in the solution.

3. **AC3 (CORS):** Given both projects are running, when the frontend makes a request to the backend, then CORS allows requests from `localhost:5173` without errors.

4. **AC4 (TypeScript strict mode):** The `tsconfig.json` has `"strict": true` and the project compiles with zero TypeScript errors.

5. **AC5 (Package manager):** The frontend uses `pnpm` as package manager with a valid `pnpm-lock.yaml` file committed.

6. **AC6 (No Swagger):** The backend `Program.cs` registers `Scalar` API documentation, never `app.UseSwagger()`.

7. **AC7 (Project references):** The .NET solution file references all four projects: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`. `SiesaAgents.API` references Application and Infrastructure; `SiesaAgents.Application` references Domain; `SiesaAgents.Infrastructure` references Application and Domain.

8. **AC8 (xUnit test project):** `tests/SiesaAgents.UnitTests` exists, is included in the solution, and `dotnet test` runs with zero failures.

## Tasks / Subtasks

- [ ] Task 1 — Initialize frontend project (AC: 1, 4, 5)
  - [ ] 1.1 Run `pnpm create vite@latest frontend -- --template react-ts` in repo root
  - [ ] 1.2 Install all required dependencies (see Dev Notes — Frontend Dependencies)
  - [ ] 1.3 Configure `tsconfig.json` with `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`
  - [ ] 1.4 Configure Vite plugin for TanStack Router (`@tanstack/router-plugin/vite`) in `vite.config.ts`
  - [ ] 1.5 Configure TailwindCSS v4 via `@tailwindcss/vite` plugin
  - [ ] 1.6 Create `src/main.tsx` with `RouterProvider` and `QueryClientProvider`
  - [ ] 1.7 Create `src/routes/__root.tsx` as minimal root layout (shell only, no navigation yet)
  - [ ] 1.8 Verify `pnpm run dev` starts on port 5173 with no errors

- [ ] Task 2 — Initialize backend solution (AC: 2, 6, 7, 8)
  - [ ] 2.1 Create solution: `dotnet new sln -n SiesaAgents`
  - [ ] 2.2 Create all four projects with `dotnet new`:
    - `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
    - `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
    - `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
    - `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
    - `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
  - [ ] 2.3 Add all projects to solution: `dotnet sln add src/... tests/...`
  - [ ] 2.4 Add project references per Clean Architecture dependency rules (see Dev Notes)
  - [ ] 2.5 Install NuGet packages (see Dev Notes — Backend Packages)
  - [ ] 2.6 Configure `Program.cs`: register Scalar, add CORS policy for `http://localhost:5173`
  - [ ] 2.7 Verify `dotnet run` in `src/SiesaAgents.API` starts on port 5000 and `/scalar` loads
  - [ ] 2.8 Verify `dotnet test` passes with zero failures

- [ ] Task 3 — Configure CORS (AC: 3)
  - [ ] 3.1 Add CORS policy in `Program.cs` allowing `http://localhost:5173`
  - [ ] 3.2 Call `app.UseCors()` before endpoint mapping
  - [ ] 3.3 Verify a manual fetch from frontend reaches backend without CORS errors

- [ ] Task 4 — Repository structure setup
  - [ ] 4.1 Create `.gitignore` covering `node_modules/`, `dist/`, `bin/`, `obj/`, `.env`, `*.user`
  - [ ] 4.2 Create root `README.md` with setup instructions (frontend and backend commands)
  - [ ] 4.3 Commit initial structure

## Dev Notes

### Architecture Context

This story establishes the monorepo structure for **Siesa-Agents**: a React SPA + .NET 10 REST API. The two projects live side by side in the repository root:

```
siesa-agents/
├── frontend/        ← Vite react-ts SPA
└── backend/         ← .NET 10 Clean Architecture solution
```

No microfrontend (Single-SPA) integration is required for this MVP — this is a standalone SPA.

[Source: architecture.md#Starter Template Evaluation]

### Frontend Dependencies

Install with `pnpm` (mandatory package manager):

```bash
# Core routing + state
pnpm add @tanstack/react-router @tanstack/react-query zustand

# Forms + validation
pnpm add react-hook-form zod @hookform/resolvers

# HTTP + UX
pnpm add axios react-loading-skeleton

# Styling
pnpm add tailwindcss @tailwindcss/vite

# UI kit
pnpm add siesa-ui-kit

# shadcn/ui (initialize + add required components)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add dialog breadcrumb

# Dev dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @vitejs/plugin-react
```

Key `vite.config.ts` configuration:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    react(),
    tailwindcss(),
  ],
  server: { port: 5173 },
})
```

[Source: architecture.md#Starter Template Evaluation]

### Backend Packages (NuGet)

```bash
dotnet add src/SiesaAgents.API package Scalar.AspNetCore
dotnet add src/SiesaAgents.Application package FluentValidation
dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions
dotnet add tests/SiesaAgents.UnitTests reference src/SiesaAgents.Application
dotnet add tests/SiesaAgents.UnitTests reference src/SiesaAgents.Domain
```

### Project References (Clean Architecture — dependency flows inward)

```
SiesaAgents.API        → references Application, Infrastructure
SiesaAgents.Application → references Domain
SiesaAgents.Infrastructure → references Application, Domain
SiesaAgents.UnitTests  → references Application, Domain
```

Commands:
```bash
dotnet add src/SiesaAgents.API reference src/SiesaAgents.Application src/SiesaAgents.Infrastructure
dotnet add src/SiesaAgents.Application reference src/SiesaAgents.Domain
dotnet add src/SiesaAgents.Infrastructure reference src/SiesaAgents.Application src/SiesaAgents.Domain
dotnet add tests/SiesaAgents.UnitTests reference src/SiesaAgents.Application src/SiesaAgents.Domain
```

[Source: architecture.md#Project Structure & Boundaries]

### Program.cs Critical Configuration

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi(); // Required for Scalar
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // NEVER app.UseSwagger()
}

app.UseCors();
app.UseHttpsRedirection();
app.Run();
```

CRITICAL: Use `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`.

[Source: company-standards.md#Backend Critical Rules, architecture.md#Corporate Standards Applied]

### Frontend Folder Structure (for this story scope)

This story creates the skeleton only. Subsequent stories fill in the modules:

```
frontend/src/
├── main.tsx                    ← RouterProvider + QueryClientProvider
├── routes/
│   └── __root.tsx              ← Root layout (minimal shell — no nav yet, Epic 1.2)
├── app/
│   └── providers/
│       └── AppProviders.tsx    ← QueryClient + RouterProvider wrappers
└── shared/
    └── lib/
        ├── apiClient.ts        ← Axios instance (baseURL from VITE_API_URL)
        └── queryClient.ts      ← TanStack QueryClient config
```

`src/shared/lib/apiClient.ts` skeleton:
```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
})
```

[Source: architecture.md#Complete Project Directory Structure]

### Key Technical Constraints

| Constraint | Rule | Source |
|---|---|---|
| Package manager | `pnpm` mandatory | company-standards.md |
| TypeScript | `strict: true` — NO `any` | company-standards.md |
| API docs | Scalar only — never Swagger | company-standards.md#Backend Critical Rules |
| Frontend port | 5173 (Vite default) | architecture.md |
| Backend port | 5000 (HTTP dev) | architecture.md |
| Environment config | `.env` (frontend: `VITE_API_URL`) | architecture.md#Infrastructure & Deployment |
| User-facing text | Spanish (not applicable in this story — no UI text yet) | company-standards.md |

### Scope Boundaries

This story creates the **empty shell** only:
- Frontend: bootstrapped app compiling with no runtime errors, no actual routes or module code
- Backend: solution structure with project references, Scalar configured, CORS enabled — no domain entities, no endpoints beyond health check, no database connection (Epic 1.3)
- Do NOT create `ClienteEntity`, `ContactoEntity`, or any EF Core DbContext — those belong to Epic 2 and 3

[Source: epic-01-foundation.md — Story scope notes]

### Testing Standards

- Frontend: Vitest + React Testing Library (configured but no tests required for this story — no logic implemented)
- Backend: xUnit project initialized; `dotnet test` must pass with zero failures (empty test project is acceptable)
- Future stories must follow TDD: write failing tests before implementation

[Source: company-standards.md#Testing Standards]

### Project Structure Notes

- Alignment with architecture.md `siesa-agents/` root layout — `frontend/` and `backend/` folders at repo root
- No conflicts identified with company-standards.md folder conventions — this story establishes the foundation
- TanStack Router file-based routing requires `routesDirectory: './src/routes'` in `vite.config.ts` and the router plugin generates `src/routeTree.gen.ts` (do not edit manually)

### References

- [Source: architecture.md#Starter Template Evaluation] — Initialization commands, starter rationale
- [Source: architecture.md#Corporate Standards Applied] — Stack versions, API docs rule
- [Source: architecture.md#Infrastructure & Deployment] — Ports, env config
- [Source: architecture.md#Project Structure & Boundaries] — Complete directory tree
- [Source: epic-01-foundation.md#Story 1.1] — Acceptance Criteria source
- [Source: company-standards.md#Backend Stack] — .NET 10, Scalar, FluentValidation
- [Source: company-standards.md#Frontend Stack] — Vite 7+, pnpm, TypeScript strict

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
