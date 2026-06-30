import { create } from 'zustand'

interface ClienteDetailState {
  clienteNotFound: boolean
  setClienteNotFound: (value: boolean) => void
}

export const useClienteDetailStore = create<ClienteDetailState>((set) => ({
  clienteNotFound: false,
  setClienteNotFound: (value) => set({ clienteNotFound: value }),
}))
