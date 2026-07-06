import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <p className="text-slate-500">Siesa Agents CRM</p>
    </main>
  )
}
