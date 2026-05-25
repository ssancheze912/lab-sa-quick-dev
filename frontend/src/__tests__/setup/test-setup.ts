import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Suppress jsdom "Not implemented: window.scrollTo" noise from TanStack Router scroll restoration
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
