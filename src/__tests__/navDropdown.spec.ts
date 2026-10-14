import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import NavDropdown, { type NavDropdownItem } from '@/components/NavDropdown.vue'

const QUERY = { session_id: '42' }
const ITEMS: NavDropdownItem[] = [
  { label: 'Session Details', to: { path: '/ongoing_session/current_session', query: QUERY } },
  { label: 'Damage and Hits', to: { path: '/ongoing_session/damages', query: QUERY } },
  { label: 'Attacker Events', to: { path: '/ongoing_session/attacker_events', query: QUERY } },
  { label: 'About', href: 'https://example.org/manual/about.html' },
]

let app: App
let router: Router
let root: HTMLElement

function button(): HTMLButtonElement {
  return root.querySelector('button')!
}

function list(): HTMLUListElement {
  return root.querySelector('ul')!
}

function links(): HTMLAnchorElement[] {
  return Array.from(root.querySelectorAll('a'))
}

function isOpen(): boolean {
  return list().style.display !== 'none'
}

function key(target: Element, keyName: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true }))
}

beforeEach(async () => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push({ path: '/ongoing_session/damages', query: QUERY })
  root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp({ render: () => h(NavDropdown, { label: 'Pages', items: ITEMS }) })
  app.use(router)
  app.mount(root)
  await router.isReady()
  await nextTick()
})

afterEach(() => {
  app.unmount()
  root.remove()
})

describe('NavDropdown', () => {
  it('is a disclosure button controlling the list of links', () => {
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(button().getAttribute('aria-controls')).toBe(list().id)
    expect(isOpen()).toBe(false)
  })

  it('toggles with the button', async () => {
    button().click()
    await nextTick()
    expect(button().getAttribute('aria-expanded')).toBe('true')
    expect(isOpen()).toBe(true)
    button().click()
    await nextTick()
    expect(isOpen()).toBe(false)
  })

  it('renders internal links and marks the current page', () => {
    const internal = links().slice(0, 3)
    expect(internal.every((a) => a.getAttribute('href')?.endsWith('?session_id=42'))).toBe(true)
    expect(internal.every((a) => a.getAttribute('target') === null)).toBe(true)
    const current = links().filter((a) => a.getAttribute('aria-current') === 'page')
    expect(current.map((a) => a.textContent)).toEqual(['Damage and Hits'])
  })

  it('opens external links in a new tab and tells screen reader users', () => {
    const external = links()[3]!
    expect(external.getAttribute('href')).toBe('https://example.org/manual/about.html')
    expect(external.getAttribute('target')).toBe('_blank')
    expect(external.getAttribute('rel')).toBe('external noopener')
    expect(external.querySelector('.visually_hidden')?.textContent).toBe(' (opens in a new tab)')
  })

  it('supports arrow keys, Home and End', async () => {
    key(button(), 'ArrowDown')
    await nextTick()
    await nextTick()
    expect(isOpen()).toBe(true)
    expect(document.activeElement).toBe(links()[0])
    key(document.activeElement!, 'ArrowUp')
    expect(document.activeElement).toBe(links()[3]) // wraps around
    key(document.activeElement!, 'Home')
    expect(document.activeElement).toBe(links()[0])
    key(document.activeElement!, 'ArrowDown')
    expect(document.activeElement).toBe(links()[1])
    key(document.activeElement!, 'End')
    expect(document.activeElement).toBe(links()[3])
  })

  it('closes with Escape and returns the focus to the button', async () => {
    key(button(), 'ArrowUp')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(links()[3])
    key(document.activeElement!, 'Escape')
    await nextTick()
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(button())
  })

  it('closes on a click outside', async () => {
    button().click()
    await nextTick()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(isOpen()).toBe(false)
  })
})
