import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

function ErrorPage({ error }: { error: Error }): React.ReactElement {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-3xl font-bold">Algo salió mal</h1>
      <p className="text-muted-foreground">{error.message}</p>
    </main>
  )
}

export function createAppRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: ErrorPage,
  })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
