// Test mock for @tanstack/react-router
// Wraps RouterProvider to pre-load the router synchronously before rendering
// This is needed because TanStack Router loads asynchronously and tests use sync assertions

export * from '@tanstack/react-router'

import * as tanstackRouter from '@tanstack/react-router'
import * as React from 'react'

type RouterProviderProps = Parameters<typeof tanstackRouter.RouterProvider>[0]

export function RouterProvider(props: RouterProviderProps) {
  const { router } = props
  const [loaded, setLoaded] = React.useState(false)
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0)

  React.useLayoutEffect(() => {
    let mounted = true
    router.load().then(() => {
      if (mounted) {
        setLoaded(true)
        forceUpdate()
      }
    }).catch(() => {
      if (mounted) setLoaded(true)
    })
    return () => { mounted = false }
  }, [router])

  if (!loaded) return null as unknown as React.ReactElement

  return React.createElement(tanstackRouter.RouterProvider, props)
}
