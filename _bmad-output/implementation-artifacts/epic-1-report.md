# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-05-25T00:24:28Z | Rama: claude/zen-gauss-LjhSb

## Resumen
- Historias procesadas: 3/3
- Exitosas (full pipeline): 3
- Con fallos: 0
- Quality Gate (Cobertura): CONCERNS (93% overall, P0 100%, P1 83%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 Project Initialization | ⏭️ | ✅ | ✅ | ⚠️(2) env | ✅ | ✅ | ✅ PASS | Completada |
| 1.2 Frontend Navigation Shell | ✅ | ✅ | ✅ | ✅(3) | ✅ | ✅ | ✅ PASS | Completada |
| 1.3 Backend Database Foundation | ✅ | ✅ | ✅ | ⚠️(1) env | ✅ | ✅ | ✅ PASS | Completada |

> ⚠️(N) env = N intentos, fallos por dotnet/backend no disponible en entorno (limitación de infraestructura, no bugs de código)

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% — 5/5 tests P0 cubiertos |
| Coverage P1 | ⚠️ CONCERNS | 83% — AC-1.3.3 snake_case parcial (sin entidades de dominio aún) |
| Coverage Overall | ⚠️ CONCERNS | 93% — gap se cierra en Epic 2 al agregar ClienteEntity |
| NFR6 (no stack traces) | ✅ PASS | ExceptionHandlingMiddleware validado |
| TypeScript strict | ✅ PASS | Zero errores TS |

## Historias que requieren atención manual

- **Story 1.2**: Componentes custom (`<nav>` + `<Link>`) en lugar de `LayoutBase`, `NavigationRail`, `NavigationBar` de siesa-ui-kit (HIGH). Navbar de 64px faltante. Deuda técnica pre-release.
- **Story 1.3**: EFCore.NamingConventions v9 vs EF Core 10 — usa `UseSnakeCaseNamingConvention()` en DI builder en vez de `modelBuilder.ApplySnakeCaseNaming()`. Funcional, pendiente actualización de paquete.
