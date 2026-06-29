import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <main>
      <h1>Siesa Agentes</h1>
    </main>
  )
}
