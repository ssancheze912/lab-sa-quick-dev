import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb'

describe('Breadcrumb', () => {
  // --- Structural contract ---
  it('[P1] renders a <nav> element with aria-label="breadcrumb"', () => {
    // GIVEN: Breadcrumb component
    render(<Breadcrumb />)
    // WHEN: checking the rendered element
    const nav = screen.getByRole('navigation')
    // THEN: it is a nav with correct aria-label
    expect(nav.tagName.toLowerCase()).toBe('nav')
    expect(nav.getAttribute('aria-label')).toBe('breadcrumb')
  })

  it('[P2] accepts and renders children inside the nav', () => {
    // GIVEN: Breadcrumb wrapping an inner element
    render(
      <Breadcrumb>
        <span data-testid="inner">child</span>
      </Breadcrumb>
    )
    // WHEN: querying for the child
    // THEN: child is present inside the nav
    expect(screen.getByTestId('inner')).toBeInTheDocument()
  })

  it('[P2] forwards extra HTML attributes to the nav element', () => {
    // GIVEN: additional data attribute
    render(<Breadcrumb data-custom="yes" />)
    // WHEN: querying the nav
    const nav = screen.getByRole('navigation')
    // THEN: custom attribute is forwarded
    expect(nav.getAttribute('data-custom')).toBe('yes')
  })
})

describe('BreadcrumbList', () => {
  it('[P1] renders an <ol> element', () => {
    // GIVEN: BreadcrumbList component
    render(<BreadcrumbList />)
    // WHEN: querying by role
    const list = screen.getByRole('list')
    // THEN: it is an ordered list
    expect(list.tagName.toLowerCase()).toBe('ol')
  })

  it('[P2] applies additional className alongside defaults', () => {
    // GIVEN: custom className passed
    render(<BreadcrumbList className="extra-class" data-testid="list" />)
    // WHEN: inspecting the element
    const list = screen.getByTestId('list')
    // THEN: custom class is present
    expect(list.className).toContain('extra-class')
  })
})

describe('BreadcrumbItem', () => {
  it('[P1] renders an <li> element', () => {
    // GIVEN: BreadcrumbItem inside a list context
    render(
      <ol>
        <BreadcrumbItem>content</BreadcrumbItem>
      </ol>
    )
    // WHEN: querying list items
    const item = screen.getByRole('listitem')
    // THEN: it is a list item
    expect(item.tagName.toLowerCase()).toBe('li')
  })

  it('[P2] renders children inside the <li>', () => {
    // GIVEN: BreadcrumbItem with child text
    render(
      <ol>
        <BreadcrumbItem>
          <span data-testid="item-child">Inicio</span>
        </BreadcrumbItem>
      </ol>
    )
    // WHEN: checking for child
    // THEN: child is present
    expect(screen.getByTestId('item-child')).toBeInTheDocument()
  })
})

describe('BreadcrumbLink', () => {
  it('[P1] renders an <a> element', () => {
    // GIVEN: BreadcrumbLink
    render(<BreadcrumbLink href="/home">Inicio</BreadcrumbLink>)
    // WHEN: querying the anchor
    const link = screen.getByRole('link', { name: 'Inicio' })
    // THEN: it is an anchor
    expect(link.tagName.toLowerCase()).toBe('a')
  })

  it('[P1] passes href attribute to the anchor', () => {
    // GIVEN: BreadcrumbLink with specific href
    render(<BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>)
    // WHEN: reading the href attribute
    const link = screen.getByRole('link', { name: 'Dashboard' })
    // THEN: href matches
    expect(link.getAttribute('href')).toBe('/dashboard')
  })

  it('[P2] renders link text content', () => {
    // GIVEN: a link with text
    render(<BreadcrumbLink href="#">Clientes</BreadcrumbLink>)
    // WHEN: querying the link text
    // THEN: text is visible
    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('[P2] applies additional className', () => {
    // GIVEN: BreadcrumbLink with extra class
    render(
      <BreadcrumbLink href="#" className="custom-link" data-testid="link">
        Test
      </BreadcrumbLink>
    )
    // WHEN: checking the class
    // THEN: custom class is present alongside defaults
    expect(screen.getByTestId('link').className).toContain('custom-link')
  })
})

describe('BreadcrumbPage', () => {
  it('[P1] renders a <span> with role="link" and aria-current="page"', () => {
    // GIVEN: BreadcrumbPage as the current page indicator
    render(<BreadcrumbPage>Actual</BreadcrumbPage>)
    // WHEN: querying the element
    const el = screen.getByText('Actual')
    // THEN: it is a span with correct accessibility attributes
    expect(el.tagName.toLowerCase()).toBe('span')
    expect(el.getAttribute('aria-current')).toBe('page')
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('[P2] renders text content', () => {
    // GIVEN: current page text
    render(<BreadcrumbPage>Configuración</BreadcrumbPage>)
    // WHEN: checking the text
    // THEN: text is in the document
    expect(screen.getByText('Configuración')).toBeInTheDocument()
  })
})

describe('BreadcrumbSeparator', () => {
  it('[P1] renders with role="presentation" and aria-hidden="true"', () => {
    // GIVEN: BreadcrumbSeparator
    render(
      <ol>
        <BreadcrumbSeparator data-testid="sep" />
      </ol>
    )
    // WHEN: querying the element
    const sep = screen.getByTestId('sep')
    // THEN: has correct accessibility attributes (presentational)
    expect(sep.getAttribute('role')).toBe('presentation')
    expect(sep.getAttribute('aria-hidden')).toBe('true')
  })

  it('[P2] renders custom children when provided', () => {
    // GIVEN: BreadcrumbSeparator with custom separator text
    render(
      <ol>
        <BreadcrumbSeparator>
          <span data-testid="custom-sep">/</span>
        </BreadcrumbSeparator>
      </ol>
    )
    // WHEN: checking for custom separator
    // THEN: custom separator is rendered instead of default icon
    expect(screen.getByTestId('custom-sep')).toBeInTheDocument()
  })
})

describe('BreadcrumbEllipsis', () => {
  it('[P1] renders with role="presentation" and aria-hidden="true"', () => {
    // GIVEN: BreadcrumbEllipsis
    render(<BreadcrumbEllipsis data-testid="ellipsis" />)
    // WHEN: querying
    const el = screen.getByTestId('ellipsis')
    // THEN: correct accessibility attributes
    expect(el.getAttribute('role')).toBe('presentation')
    expect(el.getAttribute('aria-hidden')).toBe('true')
  })

  it('[P2] contains a screen-reader-only "Más" text', () => {
    // GIVEN: BreadcrumbEllipsis rendered
    render(<BreadcrumbEllipsis />)
    // WHEN: searching for the sr-only text
    const srText = screen.getByText('Más')
    // THEN: sr-only text is present for accessibility
    expect(srText).toBeInTheDocument()
    expect(srText.className).toContain('sr-only')
  })
})

describe('Breadcrumb full composition', () => {
  it('[P1] renders a complete 3-item breadcrumb without errors', () => {
    // GIVEN: a full breadcrumb structure
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/clientes">Clientes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detalle</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    // WHEN: checking all items are rendered
    // THEN: all labels are visible
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Detalle')).toBeInTheDocument()
  })

  it('[P2] last breadcrumb item has aria-current="page"', () => {
    // GIVEN: a breadcrumb where last item is BreadcrumbPage
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Página Actual</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    // WHEN: querying the page element
    const pageCurrent = screen.getByText('Página Actual')
    // THEN: it has aria-current="page"
    expect(pageCurrent.getAttribute('aria-current')).toBe('page')
  })
})
