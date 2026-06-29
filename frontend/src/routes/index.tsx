import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePlaceholder,
})

function HomePlaceholder(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-2xl font-bold">Siesa Agents</h1>
      <p className="text-muted-foreground">Application shell placeholder</p>
    </main>
  )
}
