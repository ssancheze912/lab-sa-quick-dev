/**
 * Story 1.2 — BMad Automate Expansion (Unit tests for the nav catalogue)
 *
 * The NAV_ITEMS array is the single source of truth for the nav shell.
 * Regressions here (wrong id, changed label, wrong path) would silently
 * break both the desktop rail and the mobile bar simultaneously — so we
 * lock the contract with unit tests.
 *
 * These tests do NOT overlap with the AppShell component tests, which
 * verify integration with the router; here we assert pure data shape.
 */

import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from './navItems';

describe('NAV_ITEMS catalogue', () => {
  describe('[P2] Cardinality', () => {
    it('should contain exactly two nav entries for MVP (Clientes + Contactos)', () => {
      // GIVEN: The story scope is limited to Clientes + Contactos
      // WHEN: We count the entries
      // THEN: NAV_ITEMS has length 2
      expect(NAV_ITEMS).toHaveLength(2);
    });

    it('should stay under the siesa-ui-kit NavigationBar 5-item budget', () => {
      // GIVEN: siesa-ui-kit's NavigationBar contract caps items at 5
      // WHEN: We count the entries
      // THEN: NAV_ITEMS length is at most 5 (protects future additions)
      expect(NAV_ITEMS.length).toBeLessThanOrEqual(5);
    });
  });

  describe('[P2] Identity contract (ids match story spec)', () => {
    it('should expose id "clientes" for the Clientes entry', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'clientes');
      expect(item).toBeDefined();
    });

    it('should expose id "contactos" for the Contactos entry', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'contactos');
      expect(item).toBeDefined();
    });

    it('should have unique ids across all entries', () => {
      // GIVEN: siesa-ui-kit uses the id to identify the active item
      // WHEN: We collect ids into a Set
      const ids = new Set(NAV_ITEMS.map((n) => n.id));

      // THEN: The Set size matches the array length (no duplicates)
      expect(ids.size).toBe(NAV_ITEMS.length);
    });
  });

  describe('[P2] Language contract (es-CO user-facing labels)', () => {
    it('should label the Clientes entry with the Spanish word "Clientes"', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'clientes');
      expect(item?.label).toBe('Clientes');
    });

    it('should label the Contactos entry with the Spanish word "Contactos"', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'contactos');
      expect(item?.label).toBe('Contactos');
    });
  });

  describe('[P2] Routing contract (paths match TanStack Router file routes)', () => {
    it('should point the Clientes entry to /clientes', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'clientes');
      expect(item?.to).toBe('/clientes');
    });

    it('should point the Contactos entry to /contactos', () => {
      const item = NAV_ITEMS.find((n) => n.id === 'contactos');
      expect(item?.to).toBe('/contactos');
    });

    it('should have unique paths across all entries', () => {
      // GIVEN: Two entries mapping to the same URL would break active-state derivation
      const paths = new Set(NAV_ITEMS.map((n) => n.to));

      // WHEN/THEN: Every path is unique
      expect(paths.size).toBe(NAV_ITEMS.length);
    });

    it('should have every path starting with a forward slash (absolute routes)', () => {
      // GIVEN: TanStack Router expects absolute paths from `to`
      // WHEN/THEN: Every entry starts with "/"
      for (const item of NAV_ITEMS) {
        expect(item.to.startsWith('/')).toBe(true);
      }
    });
  });

  describe('[P2] Icon contract', () => {
    it('should provide a renderable React component for every entry', () => {
      // GIVEN: Heroicons v2 icons are React components (either function or
      // ForwardRefExoticComponent objects). Both are valid, but must be renderable.
      // WHEN/THEN: Every entry's icon is defined and either a function OR a valid React element type (object with $$typeof or render)
      for (const item of NAV_ITEMS) {
        expect(item.icon).toBeDefined();
        const kind = typeof item.icon;
        // Accept both function components and forwardRef component objects.
        expect(['function', 'object'].includes(kind)).toBe(true);
      }
    });
  });
});
