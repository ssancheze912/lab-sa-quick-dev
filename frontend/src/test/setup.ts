import '@testing-library/jest-dom'
import { server } from './msw-server'
import { beforeAll, afterEach, afterAll } from 'vitest'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
