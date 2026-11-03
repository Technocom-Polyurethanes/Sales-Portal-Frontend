// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { paginate } from "./paginate"

/** Height of a page body in the fake layout, in CSS pixels. */
const BODY_HEIGHT = 100

/** Fake heights: a table is 20 + 10 per row, anything else says its own. */
const rowsOf = (el: HTMLElement) => el.querySelectorAll("tbody tr").length
const heightOf = (el: HTMLElement) =>
  el.querySelector("tbody") ? 20 + rowsOf(el) * 10 : Number(el.dataset.h ?? 0)

const proto = HTMLElement.prototype
const original = {
  clientHeight: Object.getOwnPropertyDescriptor(proto, "clientHeight"),
  offsetHeight: Object.getOwnPropertyDescriptor(proto, "offsetHeight"),
  offsetTop: Object.getOwnPropertyDescriptor(proto, "offsetTop"),
}

function restore(name: keyof typeof original) {
  const descriptor = original[name]
  if (descriptor) Object.defineProperty(proto, name, descriptor)
  else delete (proto as unknown as Record<string, unknown>)[name]
}

beforeEach(() => {
  Object.defineProperty(proto, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains("doc-page__body") ? BODY_HEIGHT : 0
    },
  })
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return heightOf(this)
    },
  })
  Object.defineProperty(proto, "offsetTop", {
    configurable: true,
    get(this: HTMLElement) {
      const before = Array.from(this.parentElement?.children ?? []).slice(
        0,
        Array.from(this.parentElement?.children ?? []).indexOf(this),
      )
      return before.reduce((sum, el) => sum + heightOf(el as HTMLElement), 0)
    },
  })
})

afterEach(() => {
  restore("clientHeight")
  restore("offsetHeight")
  restore("offsetTop")
})

function table(rows: number): string {
  const body = Array.from({ length: rows }, (_, i) => `<tr><td>${i}</td></tr>`)
  return `<section class="doc-section"><table class="doc-table"><tbody>${body.join("")}</tbody></table></section>`
}

function build(unitsHtml: string): { source: HTMLElement; target: HTMLElement } {
  const source = document.createElement("div")
  source.innerHTML =
    `<div data-doc-part="header"><header class="doc-header"></header></div>` +
    `<div data-doc-part="footer"><footer class="doc-footer"></footer></div>` +
    unitsHtml
  return { source, target: document.createElement("div") }
}

const rowsOnPage = (page: Element) => page.querySelectorAll("tbody tr").length

describe("paginate", () => {
  it("puts the header and the footer on every page", () => {
    const { source, target } = build(
      `<div data-doc-unit><section data-h="60"></section></div>` +
        `<div data-doc-unit><section data-h="60"></section></div>`,
    )

    expect(paginate(source, target)).toBe(2)
    for (const page of Array.from(target.children)) {
      expect(page.querySelector(".doc-header")).not.toBeNull()
      expect(page.querySelector(".doc-footer")).not.toBeNull()
    }
  })

  it("splits a table by rows when it is not kept together", () => {
    const { source, target } = build(
      `<div data-doc-unit><section data-h="40"></section></div>` +
        `<div data-doc-unit>${table(4)}</div>`,
    )

    paginate(source, target)
    const pages = Array.from(target.children)
    expect(pages.map(rowsOnPage)).toEqual([2, 2])
  })

  it("moves a kept table whole to the next page instead of splitting it", () => {
    const { source, target } = build(
      `<div data-doc-unit><section data-h="40"></section></div>` +
        `<div data-doc-unit data-doc-keep>${table(4)}</div>`,
    )

    paginate(source, target)
    const pages = Array.from(target.children)
    expect(pages.map(rowsOnPage)).toEqual([0, 4])
  })

  it("keeps a kept table on the current page when it fits", () => {
    const { source, target } = build(
      `<div data-doc-unit><section data-h="20"></section></div>` +
        `<div data-doc-unit data-doc-keep>${table(4)}</div>`,
    )

    expect(paginate(source, target)).toBe(1)
    expect(rowsOnPage(target)).toBe(4)
  })

  it("still splits a kept table that is taller than a page, without losing rows", () => {
    const { source, target } = build(
      `<div data-doc-unit data-doc-keep>${table(12)}</div>`,
    )

    paginate(source, target)
    const pages = Array.from(target.children)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.map(rowsOnPage).reduce((a, b) => a + b, 0)).toBe(12)
  })
})
