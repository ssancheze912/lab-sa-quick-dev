# Pipeline sa-quick-dev — Epic 1: Project Foundation & Application Shell

> Generado: 2026-05-21 | Rama: develop

## Resumen
- Historias procesadas: 2/3 (Story 1.3 ya estaba done al inicio del pipeline)
- Exitosas (full pipeline): 0
- Con fallos: 2 (Story 1.1: ATDD constraint ambiental; Story 1.2: Code Review FAIL crítico)
- Quality Gate (Cobertura): CONCERNS — 88% overall (P0: 100%, P1: 92%, P2: 100%)

## Detalle por Historia

| Historia | Create | ATDD | Dev | ATDD-Run | Automate | Test Review | Code Review | Estado |
|----------|--------|------|-----|----------|----------|-------------|-------------|--------|
| 1.1 Project Init | ✅ | ✅ | ✅ | ❌(3/3) | ⏭️ | ⏭️ | ⏭️ | FAIL: backend ECONNREFUSED (constraint ambiental: .NET SDK no disponible) |
| 1.2 Nav Shell | ✅ | ✅ | ✅ | ✅(2) | ✅ | ✅ | ❌ FAIL | FAIL: AppShell usa `<nav>` custom en lugar de NavigationRail/NavigationBar de siesa-ui-kit |
| 1.3 DB Foundation | ⏭️ | ⏭️ | ⏭️ | ⏭️ | ⏭️ | ⏭️ | ⏭️ | OMITIDA (ya estaba done desde sesión previa) |

## Quality Gate

| Gate | Status | Detalle |
|------|--------|---------|
| Coverage P0 | ✅ PASS | 100% cubierto |
| Coverage P1 | ✅ PASS | 92% (mínimo 90%) |
| Coverage Overall | ⚠️ CONCERNS | 88% (mínimo 80% — OK numérico, pero GAP-01 crítico) |
| Fidelity siesa-ui-kit | ❌ FAIL | Story 1.2 AppShell no usa NavigationRail/NavigationBar de siesa-ui-kit |

## Historias que requieren atención manual

1. **Story 1.1** — ATDD tests de backend (AC2, AC3, AC5) requieren `.NET SDK` en el entorno para ejecutarse. La implementación es correcta estructuralmente; los tests fallarán en cualquier entorno sin .NET runtime. Verificar en entorno con .NET 10 instalado.

2. **Story 1.2** — CRÍTICO: `frontend/src/shared/components/AppShell.tsx` implementa navegación con elementos `<nav>` HTML custom en lugar de los componentes `NavigationRail` y `NavigationBar` del paquete `siesa-ui-kit` (v1.0.194+). Es un requisito mandatorio de los estándares de la compañía. Reemplazar la implementación custom con los componentes del design system y volver a pasar Code Review.
   - Adicionalmente: eliminar `frontend/src/routes/not-found.tsx` (código muerto — la vista 404 real está en `notFoundComponent: NotFoundView` en `__root.tsx`).
   - 18 tests marcados como `test.fixme()` en e2e/tests/navigation/ requieren agregar `data-testid="nav-item-clientes"`, `data-testid="nav-item-contactos"` y atributo `data-active` a los componentes de siesa-ui-kit una vez integrados.
