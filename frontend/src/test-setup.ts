import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Set React act() environment for proper async testing
// @ts-expect-error - globalThis type
globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})
