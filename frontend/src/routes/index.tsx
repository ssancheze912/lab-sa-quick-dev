import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">Siesa Agents</h1>
        <p className="mt-2 text-slate-600">Bienvenido a Siesa Agents</p>
      </div>
    </div>
  )
}
