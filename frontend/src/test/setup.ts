import '@testing-library/jest-dom'

// jsdom does not implement ResizeObserver, which siesa-ui-kit's `Select`
// (built on Headless UI's Listbox) requires to position its menu.
// Story 2.6 is the first component test suite to open a `Select` dropdown.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
