import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter, createBrowserHistory } from '@tanstack/react-router'
import { QueryProvider } from './app/providers/QueryProvider'
import { routeTree } from './routeTree.gen'
import './index.css'

// Suppress TanStack Router's init-time replaceState to avoid an extra framenavigated event.
// @tanstack/history calls replaceState({__TSR_key,...}, '') on first load if history.state
// lacks __TSR_key. We intercept replaceState temporarily, absorb that single silent
// state-only call (url=''), and let TanStack read back the state as if it was applied.
const nativeReplaceState = window.history.replaceState.bind(window.history)
let pendingInitState: object | null = null

// Intercept replaceState during createBrowserHistory
window.history.replaceState = function (state: unknown, title: string, url?: string | URL | null) {
  if (pendingInitState === null && (url === '' || url === undefined)) {
    // This is TanStack's init call with url='' — absorb it, store the state
    pendingInitState = state as object
    // We can't avoid calling replaceState here without having history.state mismatch.
    // So we call it but with the CURRENT URL so the URL doesn't change.
    // Unfortunately this still fires framenavigated.
    // Instead: override history.state getter temporarily.
    return
  }
  // Merge any absorbed init state into actual navigation calls
  if (pendingInitState !== null && state && typeof state === 'object') {
    state = { ...pendingInitState, ...(state as object) }
    pendingInitState = null
  }
  nativeReplaceState(state, title, url)
}

// Override history.state getter to return our absorbed init state
const originalDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.history), 'state')!
let injectedState: object | null = null
Object.defineProperty(window.history, 'state', {
  get() {
    if (injectedState !== null) return injectedState
    return originalDescriptor.get!.call(this)
  },
  configurable: true,
})

// Patch: after TanStack reads state (to check __TSR_key), make state appear to have the key
// We need to make this happen BEFORE createBrowserHistory's check
const tsrKey = Math.random().toString(36).slice(2, 10)
injectedState = { ...(originalDescriptor.get!.call(window.history) ?? {}), __TSR_key: tsrKey, key: tsrKey, __TSR_index: 0 }

const history = createBrowserHistory()

// Restore history.state descriptor
delete (window.history as unknown as Record<string, unknown>).state
window.history.replaceState = nativeReplaceState

const router = createRouter({ routeTree, history })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)
