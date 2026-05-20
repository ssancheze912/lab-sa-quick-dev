# Story 1.1: Project Initialization & Repository Structure

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
so that the team has a working development environment with both servers running.

## Acceptance Criteria

1. **Given** a clean development machine with Node.js and .NET 10 installed, **When** the developer runs the frontend initialization commands, **Then** `npm run dev` starts the Vite server on port 5173 with no errors and the app compiles with TypeScript strict mode enabled.

2. **Given** the backend project has been created, **When** the developer runs `dotnet run` in `SiesaAgents.API`, **Then** the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`.

3. **Given** the backend solution has been created, **When** the developer inspects the `.sln` file, **Then** the four Clean Architecture projects (`SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`) are all referenced and build without errors (`dotnet build` exits 0).

4. **Given** both projects are running, **When** the frontend makes any HTTP request to the backend, **Then** CORS allows requests from `localhost:5173` without errors (no CORS-blocked responses in browser console).

## Tasks / Subtasks

- [ ] Task 1 — Initialize Frontend project (AC: 1)
  - [ ] Run `npm create vite@latest frontend -- --template react-ts` in project root
  - [ ] Enable TypeScript strict mode in `tsconfig.app.json` (`"strict": true`)
  - [ ] Install all required dependencies (see Dev Notes for exact commands)
  - [ ] Configure `vite.config.ts` with server port 5173 and `@tanstack/router-plugin`
  - [ ] Configure TailwindCSS v4 via `@tailwindcss/vite` plugin
  - [ ] Initialize shadcn/ui with `npx shadcn@latest init && npx shadcn@latest add dialog breadcrumb`
  - [ ] Verify `npm run dev` starts without errors

- [ ] Task 2 — Initialize Backend solution with 4 Clean Architecture projects (AC: 2, 3)
  - [ ] Create solution: `dotnet new sln -n SiesaAgents`
  - [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
  - [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
  - [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
  - [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
  - [ ] Create unit test project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
  - [ ] Add all 4 projects to the solution file
  - [ ] Add project references: API → Application + Infrastructure; Application → Domain; Infrastructure → Domain + Application
  - [ ] Verify `dotnet build` exits 0

- [ ] Task 3 — Configure Scalar for API documentation (AC: 2)
  - [ ] Add Scalar package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
  - [ ] Register `builder.Services.AddOpenApi()` and `app.MapOpenApi()` in `Program.cs`
  - [ ] Register `app.MapScalarApiReference()` in `Program.cs`
  - [ ] **NEVER** use `app.UseSwagger()` or `app.UseSwaggerUI()`
  - [ ] Configure Kestrel to listen on port 5000 via `launchSettings.json` or `appsettings.Development.json`
  - [ ] Verify GET `/scalar` returns HTTP 200

- [ ] Task 4 — Configure CORS (AC: 4)
  - [ ] In `Program.cs`, register CORS policy allowing origin `http://localhost:5173`
  - [ ] Apply CORS middleware before routing: `app.UseCors()`
  - [ ] Verify preflight OPTIONS request from `localhost:5173` returns `Access-Control-Allow-Origin`

- [ ] Task 5 — Install required backend packages
  - [ ] `dotnet add src/SiesaAgents.Application package FluentValidation`
  - [ ] `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Verify `dotnet restore` completes without errors

## Dev Notes

### Architecture Context

This story creates the empty scaffolding only — no domain entities, no database migrations, no API endpoints. Domain entities (`ClienteEntity`, `ContactoEntity`) and EF Core migrations are deferred to Epic 2 (Story 2.1) and Epic 3 (Story 3.1) respectively.

**Project layout:**

```
{repo-root}/
├── frontend/          ← Vite react-ts SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tailwind.config.ts
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       └── routes/    ← TanStack Router file-based (populated in Story 1.2)
└── backend/
    ├── SiesaAgents.sln
    ├── src/
    │   ├── SiesaAgents.API/
    │   ├── SiesaAgents.Application/
    │   ├── SiesaAgents.Domain/
    │   └── SiesaAgents.Infrastructure/
    └── tests/
        └── SiesaAgents.UnitTests/
```

### Frontend — Exact Dependency Installation Commands

Run from `frontend/` directory:

```bash
# Core framework already from Vite template (react, react-dom, typescript)
npm install siesa-ui-kit
npm install @tanstack/react-router @tanstack/react-query zustand
npm install axios react-hook-form zod @hookform/resolvers react-loading-skeleton
npx shadcn@latest init && npx shadcn@latest add dialog breadcrumb
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin
```

**Key package versions (company standards):**
- Vite 7+
- React 18+
- TypeScript 5+ with `"strict": true`
- TanStack Router 1+
- TanStack Query 5+
- Zustand 5+
- TailwindCSS v4

### Frontend — `vite.config.ts` Key Configuration

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
  },
})
```

### Frontend — TypeScript Strict Mode

`tsconfig.app.json` must have:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

`any` types are prohibited by company standards.

### Backend — `Program.cs` Minimal Template

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.Run();
```

**Critical rules:**
- `app.MapScalarApiReference()` — NEVER `app.UseSwagger()` (company standard)
- CORS must be added before routing and after `UseHttpsRedirection`
- Port 5000: set in `Properties/launchSettings.json` under `applicationUrl: "http://localhost:5000"`

### Backend — Project References

Add these project references (`dotnet add reference`) so dependency direction flows inward:

```
SiesaAgents.API       → SiesaAgents.Application
SiesaAgents.API       → SiesaAgents.Infrastructure
SiesaAgents.Application → SiesaAgents.Domain
SiesaAgents.Infrastructure → SiesaAgents.Domain
SiesaAgents.Infrastructure → SiesaAgents.Application
SiesaAgents.UnitTests → SiesaAgents.Application
SiesaAgents.UnitTests → SiesaAgents.Domain
```

`SiesaAgents.Domain` has ZERO project dependencies (Clean Architecture core rule).

### Backend — `launchSettings.json` Port Configuration

In `src/SiesaAgents.API/Properties/launchSettings.json`:

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### Testing Requirements

**Smoke/Build checks (mandatory before any other tests):**
- `npm run build` in `frontend/` must exit 0 (TypeScript strict compile gate)
- `dotnet build` in `backend/` must exit 0

**API checks:**
- GET `http://localhost:5000/scalar` → HTTP 200
- OPTIONS request from origin `http://localhost:5173` → `Access-Control-Allow-Origin: http://localhost:5173` header present

**Unit test:** Verify `SiesaAgents.UnitTests` project runs with `dotnet test` (0 tests initially is acceptable).

No Vitest/RTL tests are required in this story — the test infrastructure setup is sufficient.

### Project Structure Notes

- This story does NOT initialize TanStack Router routes — the `routes/` folder is scaffolded empty. Route definitions begin in Story 1.2.
- No `AppDbContext.cs`, no EF Core configuration, no migrations — those are created in Story 1.3.
- No domain entities created in this story per the Epic scope note: "Do NOT define `ClienteEntity` or `ContactoEntity` in this story."
- `src/shared/lib/apiClient.ts` (Axios singleton) may be created as an empty placeholder in this story but is not required.
- Package manager: `npm` for this project (Vite template default). Use `pnpm` only for new projects where the team explicitly chooses it from the start.

### References

- Architecture decisions: `_bmad-output/planning-artifacts/architecture.md` — Sections: "Starter Template Evaluation", "Infrastructure & Deployment", "Authentication & Security" (CORS), "API & Communication Patterns" (Scalar)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Backend Stack, Frontend Stack, Backend Critical Rules
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` — Story 1.1 AC
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-1.md` — Risk R3 (CORS), R7 (TypeScript build), R9 (Scalar)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
