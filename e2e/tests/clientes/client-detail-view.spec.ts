/**
 * E2E Acceptance Tests — Story 2.2: Client Detail View
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-2-client-detail-view.md is complete.
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking a client item shows detail panel with all 4 fields + URL updates to /clientes/:clienteId
 *   AC#2 — Direct URL /clientes/:clienteId loads the correct client details (FR30 deep linking)
 *   AC#3 — Invalid clienteId shows a not-found message gracefully; client list remains visible
 *
 * Test cases:
 *   TC-E2-P1-07: Deep link — direct URL /clientes/:clienteId loads correct client (E2E)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// TC-E2-P1-07 — Deep link: direct URL /clientes/:clienteId loads correct client
// ---------------------------------------------------------------------------

test.describe('AC#2 — Deep link /clientes/:clienteId (TC-E2-P1-07)', () => {
  test('should load the correct client details when navigating directly to /clientes/:clienteId', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nombre: 'Empresa Deep Link SA', telefono: '3001234567', ciudad: 'Bogotá' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client exists in the system with a known ID

      // WHEN: User navigates directly to /clientes/:clienteId (deep link)
      // Network-first: wait for the API call triggered by the route before asserting
      const detailResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/clientes/${created.id}`) && resp.status() === 200,
      );

      await page.goto(`/clientes/${created.id}`);
      await detailResponse;

      // THEN: The right panel shows the client's Nombre
      await expect(page.getByTestId('clientes-detail-panel')).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should display correct Nombre in detail panel on direct URL navigation', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nombre: 'Direct URL Corp' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client "Direct URL Corp" exists with a known ID
      // WHEN: User navigates directly to /clientes/:clienteId
      const detailResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/clientes/${created.id}`) && resp.status() === 200,
      );

      await page.goto(`/clientes/${created.id}`);
      await detailResponse;

      // THEN: The client's Nombre is displayed in the detail panel
      await expect(
        page.getByTestId('clientes-detail-panel').getByText('Direct URL Corp'),
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should display NIT in detail panel on direct URL navigation', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nit: '900555666-7' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client with NIT "900555666-7" exists
      // WHEN: User navigates directly to /clientes/:clienteId
      const detailResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/clientes/${created.id}`) && resp.status() === 200,
      );

      await page.goto(`/clientes/${created.id}`);
      await detailResponse;

      // THEN: The NIT is visible in the detail panel
      await expect(
        page.getByTestId('clientes-detail-panel').getByText('900555666-7'),
      ).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should keep the client list visible (left panel) alongside the detail view (right panel)', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: A client exists in the system
      // WHEN: User navigates directly to /clientes/:clienteId
      const detailResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/clientes/${created.id}`) && resp.status() === 200,
      );

      await page.goto(`/clientes/${created.id}`);
      await detailResponse;

      // THEN: Both the left panel (client list) and right panel (detail) are visible
      await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
      await expect(page.getByTestId('clientes-detail-panel')).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ---------------------------------------------------------------------------
// AC#1 — Clicking a client item shows detail panel + URL updates
// ---------------------------------------------------------------------------

test.describe('AC#1 — Click client item shows detail + URL update', () => {
  test('should show the client detail panel when user clicks a client item', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nombre: 'Empresa Click Test SAS' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: Client list is loaded with at least one client
      const listResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') &&
          !resp.url().includes(created.id) &&
          resp.status() === 200,
      );

      await page.goto('/clientes');
      await listResponse;

      // Ensure the list item is rendered
      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Click Test SAS' }),
      ).toBeVisible();

      // Set up detail API interception before clicking
      const detailResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/v1/clientes/${created.id}`) && resp.status() === 200,
      );

      // WHEN: User clicks on the client item
      await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa Click Test SAS' }).click();
      await detailResponse;

      // THEN: The detail panel becomes visible
      await expect(page.getByTestId('clientes-detail-panel')).toBeVisible();
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });

  test('should update the URL to /clientes/:clienteId when user clicks a client item', async ({
    page,
    request,
  }) => {
    const apiHelper = new ApiHelper(request);
    const clienteData = buildCliente({ nombre: 'Empresa URL Update Ltda' });
    const created = await apiHelper.createCliente(clienteData);

    try {
      // GIVEN: Client list is loaded
      const listResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/v1/clientes') &&
          !resp.url().includes(created.id) &&
          resp.status() === 200,
      );

      await page.goto('/clientes');
      await listResponse;

      await expect(
        page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Update Ltda' }),
      ).toBeVisible();

      // WHEN: User clicks the client item
      await page.getByTestId('cliente-list-item').filter({ hasText: 'Empresa URL Update Ltda' }).click();

      // THEN: URL updates to /clientes/:clienteId (FR30 deep linking)
      await page.waitForURL(`**/clientes/${created.id}`);
      expect(page.url()).toContain(`/clientes/${created.id}`);
    } finally {
      await apiHelper.deleteCliente(created.id).catch(() => null);
    }
  });
});

// ---------------------------------------------------------------------------
// AC#3 — Invalid clienteId shows not-found gracefully
// ---------------------------------------------------------------------------

test.describe('AC#3 — Invalid clienteId shows not-found message gracefully', () => {
  test('should display a not-found message when navigating to /clientes/id-inexistente', async ({
    page,
  }) => {
    // GIVEN: No client exists with a null UUID
    // Network-first: intercept the detail API call before navigating
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000000', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          status: 404,
          title: 'Cliente no encontrado.',
          detail: 'Cliente con id \'00000000-0000-0000-0000-000000000000\' no encontrado.',
        }),
      }),
    );

    // Also intercept the list endpoint so the left panel can load
    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to /clientes/00000000-0000-0000-0000-000000000000
    await page.goto('/clientes/00000000-0000-0000-0000-000000000000');

    // THEN: A not-found message is displayed (not a JS error, not a blank panel)
    await expect(
      page.getByText(/cliente no encontrado/i),
    ).toBeVisible();
  });

  test('should keep the client list panel visible when detail shows not-found', async ({
    page,
  }) => {
    // GIVEN: No client with the null UUID; but list may have clients
    await page.route('**/api/v1/clientes/00000000-0000-0000-0000-000000000000', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Cliente no encontrado.' }),
      }),
    );

    await page.route('**/api/v1/clientes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    // WHEN: User navigates to an invalid clienteId URL
    await page.goto('/clientes/00000000-0000-0000-0000-000000000000');

    // THEN: The left panel (client list) is still visible
    await expect(page.getByTestId('clientes-list-panel')).toBeVisible();
  });
});
