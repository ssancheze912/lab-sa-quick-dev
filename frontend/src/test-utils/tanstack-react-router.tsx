/**
 * Test-time @tanstack/react-router wrapper.
 *
 * The key insight: router.startTransition defaults to (fn) => fn() synchronously
 * BEFORE the Transitioner component renders. If we call router.load() before
 * rendering RouterProvider, it uses the synchronous startTransition.
 *
 * However, the async fn inside startTransition still creates a Promise chain.
 * To handle this, we use React Suspense: RouterProvider suspends until the
 * eagerly-started load Promise resolves.
 *
 * Since render() in RTL uses act(), and act() flushes microtasks, the Suspense
 * boundary resolves within the act() call when the Promise completes in
 * the microtask queue.
 *
 * Usage: This file is aliased as @tanstack/react-router in vitest test config.
 */

// Re-export everything from the real @tanstack/react-router package
export * from '/home/user/lab-sa-quick-dev/frontend/node_modules/.pnpm/@tanstack+react-router@1.170.16_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/@tanstack/react-router/dist/esm/index.js'

import {
  RouterProvider as RealRouterProvider,
  createRouter as realCreateRouter,
} from '/home/user/lab-sa-quick-dev/frontend/node_modules/.pnpm/@tanstack+react-router@1.170.16_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/@tanstack/react-router/dist/esm/index.js'

import type { RouterProps } from '/home/user/lab-sa-quick-dev/frontend/node_modules/.pnpm/@tanstack+react-router@1.170.16_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/@tanstack/react-router/dist/esm/index.js'

import React, { Suspense } from 'react'

// Suspense resource factory
interface Resource<T> {
  read(): T
}

function createSuspenseResource<T>(promise: Promise<T>): Resource<T> {
  let status: 'pending' | 'success' | 'error' = 'pending'
  let value: T
  let error: unknown

  promise.then(
    (v) => { status = 'success'; value = v },
    (e) => { status = 'error'; error = e }
  )

  return {
    read() {
      if (status === 'pending') throw promise
      if (status === 'error') throw error
      return value
    }
  }
}

// Map of router → its eagerly-started load resource
const loadResources = new WeakMap<object, Resource<void>>()

/**
 * createRouter wrapper that eagerly starts router.load() before any rendering.
 *
 * Since startTransition defaults to (fn) => fn() synchronously before
 * Transitioner renders, calling load() here uses synchronous startTransition.
 * The async inner fn still creates a Promise, but it starts resolving immediately.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRouter(options: any) {
  const router = realCreateRouter(options)
  // Eagerly start the load. router.startTransition is synchronous at this point.
  const loadPromise = router.load()
  loadResources.set(router, createSuspenseResource(loadPromise))
  return router
}

function RouterContent({ router, ...rest }: RouterProps) {
  // Suspend until the eager load completes
  const resource = loadResources.get(router)
  if (resource) {
    resource.read() // throws Promise if not yet resolved
  }
  return React.createElement(RealRouterProvider, { router, ...rest })
}

/**
 * Test-safe RouterProvider.
 *
 * Uses React Suspense to wait for the eagerly-started router.load() to complete.
 * Within act(), React 18 processes Suspense resolutions, so by the time
 * render() returns, the router content is fully rendered.
 */
export function RouterProvider({ router, ...rest }: RouterProps) {
  return React.createElement(
    Suspense,
    { fallback: null },
    React.createElement(RouterContent, { router, ...rest })
  )
}
