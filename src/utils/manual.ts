// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Links into the Hunter manual. Only the page paths relative to the base URL are hardcoded elsewhere.

export const MANUAL_BASE_URL = 'https://hunter-for-fg.github.io/manual/'

/** Absolute URL of a page in the manual, e.g. manualUrl('about.html'). */
export function manualUrl(page: string): string {
  return new URL(page, MANUAL_BASE_URL).href
}
