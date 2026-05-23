import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ensure RTL cleanup runs after each test even without vitest globals enabled
afterEach(() => {
  cleanup()
})
