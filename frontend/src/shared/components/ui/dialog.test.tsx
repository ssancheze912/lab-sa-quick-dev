import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

describe('DialogHeader', () => {
  it('[P1] renders a div with its children', () => {
    // GIVEN: DialogHeader with children
    render(
      <DialogHeader data-testid="header">
        <span data-testid="child">Title</span>
      </DialogHeader>
    )
    // WHEN: querying the header
    const header = screen.getByTestId('header')
    // THEN: it is a div containing the child
    expect(header.tagName.toLowerCase()).toBe('div')
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('[P2] applies additional className alongside defaults', () => {
    // GIVEN: DialogHeader with custom class
    render(<DialogHeader className="custom-header" data-testid="header" />)
    // WHEN: checking className
    // THEN: custom class is present
    expect(screen.getByTestId('header').className).toContain('custom-header')
  })

  it('[P2] contains default flex-col layout classes', () => {
    // GIVEN: DialogHeader without custom class
    render(<DialogHeader data-testid="header" />)
    // WHEN: checking className
    // THEN: default class includes flex flex-col
    expect(screen.getByTestId('header').className).toContain('flex')
    expect(screen.getByTestId('header').className).toContain('flex-col')
  })
})

describe('DialogFooter', () => {
  it('[P1] renders a div with its children', () => {
    // GIVEN: DialogFooter with children
    render(
      <DialogFooter data-testid="footer">
        <button>Cancel</button>
        <button>Confirm</button>
      </DialogFooter>
    )
    // WHEN: querying the footer
    const footer = screen.getByTestId('footer')
    // THEN: it is a div
    expect(footer.tagName.toLowerCase()).toBe('div')
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('[P2] applies additional className', () => {
    // GIVEN: DialogFooter with extra class
    render(<DialogFooter className="custom-footer" data-testid="footer" />)
    // WHEN: checking class
    // THEN: custom class present
    expect(screen.getByTestId('footer').className).toContain('custom-footer')
  })

  it('[P2] default classes include flex layout', () => {
    // GIVEN: DialogFooter without extra class
    render(<DialogFooter data-testid="footer" />)
    // WHEN: checking className
    // THEN: contains flex
    expect(screen.getByTestId('footer').className).toContain('flex')
  })
})

describe('Dialog (open state interaction)', () => {
  it('[P0] renders dialog trigger visible to users', () => {
    // GIVEN: Dialog with a trigger button
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
      </Dialog>
    )
    // WHEN: checking for the trigger
    // THEN: the trigger button is visible
    expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument()
  })

  it('[P1] dialog content is not rendered when dialog is closed (default)', () => {
    // GIVEN: Dialog without open prop (default closed)
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <span data-testid="dialog-body">Body content</span>
        </DialogContent>
      </Dialog>
    )
    // WHEN: dialog is closed by default
    // THEN: dialog body content is NOT in the DOM
    expect(screen.queryByTestId('dialog-body')).not.toBeInTheDocument()
  })

  it('[P1] dialog content is rendered when open=true', () => {
    // GIVEN: Dialog with open={true}
    render(
      <Dialog open>
        <DialogContent>
          <span data-testid="open-body">Open content</span>
        </DialogContent>
      </Dialog>
    )
    // WHEN: dialog is forced open
    // THEN: body content is visible
    expect(screen.getByTestId('open-body')).toBeInTheDocument()
  })

  it('[P1] dialog content contains a close button with sr-only text "Cerrar"', () => {
    // GIVEN: Dialog open with content
    render(
      <Dialog open>
        <DialogContent>content</DialogContent>
      </Dialog>
    )
    // WHEN: looking for the close button
    const closeText = screen.getByText('Cerrar')
    // THEN: sr-only "Cerrar" label is present for accessibility
    expect(closeText).toBeInTheDocument()
    expect(closeText.className).toContain('sr-only')
  })

  it('[P2] DialogTitle renders with correct text', () => {
    // GIVEN: open dialog with a title
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Mi Título</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    // WHEN: querying the title
    // THEN: title text is present
    expect(screen.getByText('Mi Título')).toBeInTheDocument()
  })

  it('[P2] DialogDescription renders its description text', () => {
    // GIVEN: open dialog with a description
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Esta es la descripción.</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    // WHEN: querying the description
    // THEN: description text is present
    expect(screen.getByText('Esta es la descripción.')).toBeInTheDocument()
  })

  it('[P2] complete dialog composition renders header, body and footer', () => {
    // GIVEN: full dialog with header, footer and content
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="dlg-header">
            <DialogTitle>Confirmación</DialogTitle>
          </DialogHeader>
          <p data-testid="dlg-body">¿Desea continuar?</p>
          <DialogFooter data-testid="dlg-footer">
            <button>Cancelar</button>
            <button>Aceptar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    // WHEN: checking all sections
    // THEN: all sections are present
    expect(screen.getByTestId('dlg-header')).toBeInTheDocument()
    expect(screen.getByTestId('dlg-body')).toBeInTheDocument()
    expect(screen.getByTestId('dlg-footer')).toBeInTheDocument()
    expect(screen.getByText('¿Desea continuar?')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
    expect(screen.getByText('Aceptar')).toBeInTheDocument()
  })
})
