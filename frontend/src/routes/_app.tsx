import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../shared/components/AppShell'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})
