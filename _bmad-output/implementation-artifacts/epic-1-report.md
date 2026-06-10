# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-06-10 | Rama: claude/bold-wright-9titd0

## Resumen
- Historias procesadas: 3/3
- Exitosas (full pipeline): 2
- Con fallos: 1 (Story 1.3 — acción manual requerida)
- Quality Gate (Cobertura): CONCERNS (86% — P0 100%, P1 78%, P2/P3 100%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 | ✅ | ✅ | ✅ | ⚠️ (3 intentos, 5/7 — env) | ✅ | ✅ | ✅ PASS | Completada |
| 1.2 | ✅ | ✅ | ✅ | ⚠️ (2 intentos, 38/40 — test-design flaw) | ✅ | ✅ | ✅ PASS | Completada |
| 1.3 | ✅ | ✅ | ✅ | ⏭️ SKIP (env — .NET SDK ausente) | ✅ | ✅ | ❌ FAIL | Requiere acción manual |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| P0 Coverage | ✅ PASS | 100% (5/5 ACs cubiertos) |
| P1 Coverage | ⚠️ CONCERNS | 78% (7/9 ACs) — mínimo 90%; 2 ACs parciales en Story 1.3 |
| P2 Coverage | ✅ PASS | 100% (5/5 ACs cubiertos) |
| P3 Coverage | ✅ PASS | 100% (2/2 ACs cubiertos) |
| Coverage Overall | ⚠️ CONCERNS | 86% (19/21 ACs) |

## Notas por Historia

### Story 1.1 — ATDD-Run
- 5/7 tests GREEN. Los 2 RED son ECONNREFUSED al puerto 5000 (backend .NET no disponible en CI).
- Todos los tests de frontend (AC1, AC4) pasan. Constraint de entorno, no bug de implementación.
- Corrección aplicada: `data-testid="app-root"` agregado a `frontend/index.html`.

### Story 1.2 — ATDD-Run
- 38/40 tests GREEN. Los 2 RED usan `framenavigated` de Playwright que dispara con History API pushState.
- Flaw de diseño de test confirmado. La SPA navigation funciona correctamente (27 otros tests lo verifican).
- `siesa-ui-kit` instalado. Nav items envueltos con `data-testid` / `aria-current` / `aria-label` explícitos.

### Story 1.3 — Code Review FAIL
- Implementación correcta (verificada por análisis estático): AppDbContext, snake_case, middleware, DI.
- **Acción manual requerida**: ejecutar `dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API/` desde `backend/src/SiesaAgents.Infrastructure/` en una máquina con .NET 10 SDK y PostgreSQL.
- EFCore.NamingConventions actualizado a 10.0.1 para compatibilidad con EF Core 10.

## Historias que requieren atención manual

- **Story 1.3** — Ejecutar migración inicial EF Core con .NET SDK + PostgreSQL local:
  ```bash
  cd backend/src/SiesaAgents.Infrastructure
  dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API/
  dotnet ef database update --startup-project ../SiesaAgents.API/
  ```
  Verificar que `siesa_agents_db` se crea y `__ef_migrations_history` usa snake_case.

## Observaciones técnicas pendientes (backlog)

- Vite 6.4.3 instalado; estándar requiere 7+ (deuda técnica, no bloquea Epic 2)
- `siesa-ui-kit`: `LayoutBase` y `Navbar` no usados en Story 1.2 (barra superior ausente)
- `AllowedOrigins` no declarado en `appsettings.json` base (entornos no-Development)
- Credenciales PostgreSQL en `appsettings.Development.json` → migrar a `dotnet user-secrets`
- 2 tests Playwright con patrón `framenavigated` (false-positive conocido, no bloquea CI)
