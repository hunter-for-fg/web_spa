// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Port of https://github.com/zimmicz/Leaflet-Coordinates-Control (version 0d21a1c, MIT licence,
// author Michal Zimmermann) - like before with lon and lat switched around.
// Displays the coordinates of a mouse click on the map. Clicking the control opens a prompt with
// copyable "lon,lat".
import * as L from 'leaflet'

export interface CoordinatesControlOptions extends L.ControlOptions {
  latitudeText?: string
  longitudeText?: string
  promptText?: string
  precision?: number
}

export class CoordinatesControl extends L.Control {
  private readonly texts: Required<Omit<CoordinatesControlOptions, keyof L.ControlOptions>>
  private container: HTMLElement | null = null
  private lngElement: HTMLElement | null = null
  private latElement: HTMLElement | null = null
  private lng: string = ''
  private lat: string = ''

  constructor(options: CoordinatesControlOptions = {}) {
    super({ position: options.position ?? 'bottomleft' })
    this.texts = {
      latitudeText: options.latitudeText ?? 'lat.',
      longitudeText: options.longitudeText ?? 'lon.',
      promptText: options.promptText ?? 'Press Ctrl+C to copy coordinates',
      precision: options.precision ?? 4,
    }
  }

  override onAdd(): HTMLElement {
    const container = L.DomUtil.create('div', 'leaflet-control-coordinates hidden')
    this.container = container
    L.DomEvent.disableClickPropagation(container)
    this.lngElement = L.DomUtil.create('span', 'leaflet-control-coordinates-lng', container)
    this.latElement = L.DomUtil.create('span', 'leaflet-control-coordinates-lat', container)
    L.DomEvent.on(container, 'click', () => {
      window.prompt(this.texts.promptText, `${this.lng},${this.lat}`)
    })
    return container
  }

  /** To be called when the user clicks the map. */
  setCoordinates(event: L.LeafletMouseEvent): void {
    if (!this.container || !this.lngElement || !this.latElement) {
      return
    }
    this.container.classList.remove('hidden')
    this.lat = event.latlng.lat.toFixed(this.texts.precision)
    this.lng = event.latlng.lng.toFixed(this.texts.precision)
    CoordinatesControl.setLabelledValue(this.latElement, this.texts.latitudeText, this.lat)
    CoordinatesControl.setLabelledValue(this.lngElement, this.texts.longitudeText, this.lng)
  }

  private static setLabelledValue(element: HTMLElement, label: string, value: string): void {
    const strong = document.createElement('strong')
    strong.textContent = `${label}:`
    element.replaceChildren(strong, document.createTextNode(` ${value}`))
  }
}
