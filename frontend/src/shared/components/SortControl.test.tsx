/**
 * Story 2.6: SortControl component — Unit Tests
 *
 * Acceptance Criteria covered:
 * - AC1: Renders with provided value selected (Nombre A→Z)
 * - AC2: Calls onChange with correct SortOption when user selects each option
 * - AC3: Default rendered option is "Más reciente" when value is 'fecha-desc'
 * - AC4: All four options are present in the DOM when dropdown is open (in Spanish)
 * - AC6: Default sort order is "Más reciente" (fecha-desc)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { SortControl } from './SortControl';
import type { SortOption } from './SortControl';

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderSortControl(value: SortOption, onChange = vi.fn()) {
  return { onChange, ...render(createElement(SortControl, { value, onChange })) };
}

// Helper to get the trigger button (the Select trigger has aria-haspopup="listbox")
function getTrigger() {
  return screen.getByRole('button');
}

// Helper to open the dropdown
async function openDropdown() {
  const trigger = getTrigger();
  await userEvent.click(trigger);
  return trigger;
}

// ─── AC4: Options present in dropdown (in Spanish) ────────────────────────────

describe('AC4 — SortControl renders all four options in Spanish when open', () => {
  it('should render all four sort options when dropdown is opened', async () => {
    renderSortControl('fecha-desc');
    await openDropdown();

    expect(screen.getByRole('option', { name: 'Más reciente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Más antiguo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Nombre A→Z' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Nombre Z→A' })).toBeInTheDocument();
  });

  it('should render label "Ordenar por:" in Spanish', () => {
    renderSortControl('fecha-desc');
    expect(screen.getByText('Ordenar por:')).toBeInTheDocument();
  });
});

// ─── AC6: Default value is fecha-desc ("Más reciente") ───────────────────────

describe('AC6 — SortControl default is "Más reciente"', () => {
  it('should show "Más reciente" text in the trigger when value is fecha-desc', () => {
    renderSortControl('fecha-desc');
    // The trigger button contains a span with the selected label text
    const trigger = getTrigger();
    expect(trigger).toHaveTextContent('Más reciente');
  });
});

// ─── AC1/AC2: Controlled component behavior ───────────────────────────────────

describe('AC1/AC2 — SortControl controlled behavior', () => {
  it('should render with the provided value selected (nombre-asc → "Nombre A→Z")', () => {
    renderSortControl('nombre-asc');
    expect(getTrigger()).toHaveTextContent('Nombre A→Z');
  });

  it('should render with nombre-desc showing "Nombre Z→A"', () => {
    renderSortControl('nombre-desc');
    expect(getTrigger()).toHaveTextContent('Nombre Z→A');
  });

  it('should render with fecha-asc showing "Más antiguo"', () => {
    renderSortControl('fecha-asc');
    expect(getTrigger()).toHaveTextContent('Más antiguo');
  });

  it('should call onChange with "nombre-asc" when "Nombre A→Z" option is selected', async () => {
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    await openDropdown();
    await userEvent.click(screen.getByRole('option', { name: 'Nombre A→Z' }));

    expect(onChange).toHaveBeenCalledWith('nombre-asc');
  });

  it('should call onChange with "nombre-desc" when "Nombre Z→A" option is selected', async () => {
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    await openDropdown();
    await userEvent.click(screen.getByRole('option', { name: 'Nombre Z→A' }));

    expect(onChange).toHaveBeenCalledWith('nombre-desc');
  });

  it('should call onChange with "fecha-asc" when "Más antiguo" option is selected', async () => {
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    await openDropdown();
    await userEvent.click(screen.getByRole('option', { name: 'Más antiguo' }));

    expect(onChange).toHaveBeenCalledWith('fecha-asc');
  });

  it('should call onChange with "fecha-desc" when "Más reciente" option is selected', async () => {
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-asc', onChange }));

    await openDropdown();
    await userEvent.click(screen.getByRole('option', { name: 'Más reciente' }));

    expect(onChange).toHaveBeenCalledWith('fecha-desc');
  });
});
