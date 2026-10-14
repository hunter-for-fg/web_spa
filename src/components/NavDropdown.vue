<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<!-- Dropdown with navigation links - internal (RouterLink) or external (opened in a new tab).
     Implemented as a disclosure (button + list of links) as recommended by WAI-ARIA for site navigation -
     not as role="menu", which is meant for application menus and changes how screen readers behave.
     Keyboard: Enter/Space toggle, ArrowDown/ArrowUp open and move between the links, Home/End jump to the
     first/last link, Escape closes and returns focus to the button. Tab leaves the dropdown and closes it. -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

export type NavDropdownItem =
  | { label: string, to: RouteLocationRaw } // page of this app
  | { label: string, href: string } // external page - opened in a new tab

defineProps<{
  label: string
  items: NavDropdownItem[]
}>()

const listId = useId()
const open = ref(false)
const shiftLeft = ref(0) // px the list is moved to the left, so it does not stick out of the window
const container = useTemplateRef<HTMLElement>('container')
const toggleButton = useTemplateRef<HTMLButtonElement>('toggleButton')
const list = useTemplateRef<HTMLUListElement>('list')
const route = useRoute()

function links(): HTMLAnchorElement[] {
  return Array.from(list.value?.querySelectorAll('a') ?? [])
}

async function show(): Promise<void> {
  open.value = true
  shiftLeft.value = 0
  await nextTick() // the list must be visible before it can be measured and the links get focus
  const rect = list.value?.getBoundingClientRect()
  if (rect) {
    const overflow = rect.right - document.documentElement.clientWidth
    shiftLeft.value = Math.max(0, Math.min(overflow, rect.left))
  }
}

async function showAndFocus(index: 'first' | 'last'): Promise<void> {
  await show()
  const all = links()
  all[index === 'first' ? 0 : all.length - 1]?.focus()
}

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) {
    toggleButton.value?.focus()
  }
}

function toggle(): void {
  if (open.value) {
    close()
  } else {
    void show()
  }
}

function onButtonKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    void showAndFocus('first')
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    void showAndFocus('last')
  }
}

function onListKeydown(event: KeyboardEvent): void {
  const all = links()
  const current = all.indexOf(document.activeElement as HTMLAnchorElement)
  let next: number
  switch (event.key) {
    case 'ArrowDown':
      next = (current + 1) % all.length
      break
    case 'ArrowUp':
      next = (current - 1 + all.length) % all.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = all.length - 1
      break
    default:
      return
  }
  event.preventDefault()
  all[next]?.focus()
}

function onEscape(): void {
  if (open.value) {
    close(true)
  }
}

// close when the focus moves out of the dropdown (e.g. by Tab)
function onFocusOut(event: FocusEvent): void {
  if (!container.value?.contains(event.relatedTarget as Node | null)) {
    close()
  }
}

// a click on a link closes the dropdown - focus goes back to the button, as the link disappears
function onLinkClick(): void {
  close(true)
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!container.value?.contains(event.target as Node)) {
    close()
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocumentPointerDown)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
  }
})

watch(() => route.fullPath, () => close())

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="container" class="nav_dropdown" @keydown.esc="onEscape" @focusout="onFocusOut">
    <button ref="toggleButton" type="button" class="toggle" :aria-expanded="open" :aria-controls="listId"
            @click="toggle" @keydown="onButtonKeydown">
      {{ label }} <span class="caret" aria-hidden="true">&#9662;</span>
    </button>
    <ul v-show="open" :id="listId" ref="list" class="dropdown" :style="{ marginLeft: `-${shiftLeft}px` }"
        @keydown="onListKeydown">
      <li v-for="item in items" :key="item.label">
        <!-- RouterLink sets aria-current="page" on the link of the current page -->
        <RouterLink v-if="'to' in item" :to="item.to" @click="onLinkClick">{{ item.label }}</RouterLink>
        <a v-else :href="item.href" rel="external noopener" target="_blank" @click="onLinkClick">
          {{ item.label }} <span aria-hidden="true">&#10697;</span><span class="visually_hidden"> (opens in a new tab)</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.nav_dropdown {
  position: relative;
  display: inline-block;
}

.toggle {
  font: inherit;
  padding: 0 0.4rem;
  min-height: 1.5rem; /* WCAG 2.5.8 target size */
  border: 1px solid var(--color-border);
  border-radius: 3px;
  background: none;
  color: var(--nav-dropdown-color, var(--color-link));
  cursor: pointer;
}

.toggle:hover {
  border-color: currentColor;
}

.caret {
  display: inline-block;
}

.toggle[aria-expanded="true"] .caret {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 1100; /* above the Leaflet maps (controls have z-index 1000) */
  width: max-content;
  max-width: calc(100vw - 2 * var(--space));
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  background-color: var(--color-surface);
  box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 0.6);
}

.dropdown a {
  display: block;
  padding: 0.3rem 0.75rem;
  text-decoration: none;
  color: var(--color-link);
}

.dropdown a:hover {
  background-color: var(--color-surface-raised);
  text-decoration: underline;
}

.dropdown a:focus-visible {
  outline-offset: -2px; /* within the dropdown, so it is not clipped by the neighbouring links */
}

/* the current page: marked not only by colour */
.dropdown a[aria-current="page"] {
  color: var(--color-text);
  font-weight: bold;
}

.dropdown a[aria-current="page"]::before {
  content: "\25B8\00a0" / "";
}
</style>
