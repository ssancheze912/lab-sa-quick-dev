/**
 * Vitest global test setup.
 *
 * Configures:
 * 1. jest-dom matchers for RTL assertions
 * 2. Cleanup after each test
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(async () => {
  cleanup()
})
