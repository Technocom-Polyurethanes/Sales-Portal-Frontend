// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../i18n/I18nProvider"
import { api } from "../../lib/api/client"
import { clearCache } from "../../lib/cache/queryCache"
import CustomerPickerModal from "./CustomerPickerModal"

type Query = { search?: string; page: number; pageSize: number }

const TOTAL = 25
const PAGE_SIZE = 10

function pageOf(query: Query) {
  const first = (query.page - 1) * PAGE_SIZE
  const count = Math.max(0, Math.min(PAGE_SIZE, TOTAL - first))
  return {
    items: Array.from({ length: count }, (_, i) => ({
      id: `c${first + i + 1}`,
      customerCode: `CUST-${first + i + 1}`,
      name: `Customer ${first + i + 1}`,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount: TOTAL,
  }
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

describe("CustomerPickerModal", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    clearCache()
    // jsdom has no layout: report no size so the modal falls back to 10 rows per page.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const render = async () => {
    await act(async () => {
      root.render(
        <I18nProvider>
          <CustomerPickerModal open customers={[]} onSelect={() => {}} onClose={() => {}} />
        </I18nProvider>,
      )
    })
  }

  const hasSkeleton = () => container.querySelector("tbody .animate-pulse") !== null
  // Real rows only: skeleton rows have cells too, but nothing in them but a pulsing bar.
  const codes = () =>
    Array.from(container.querySelectorAll("tbody td:first-child"))
      .filter((cell) => cell.querySelector(".animate-pulse") === null)
      .map((cell) => cell.textContent)
  const click = async (label: string) => {
    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent === label,
    )!
    await act(async () => button.click())
  }

  it("shows skeleton rows until the first page arrives, then the rows in server order", async () => {
    let resolveFirst!: (value: unknown) => void
    const get = vi.spyOn(api, "get").mockImplementation((_path, query) => {
      const request = query as Query
      if (request.page === 1) return new Promise((resolve) => (resolveFirst = resolve)) as never
      return Promise.resolve(pageOf(request)) as never
    })

    await render()
    expect(hasSkeleton()).toBe(true)
    expect(codes()).toEqual([])

    await act(async () => resolveFirst(pageOf({ page: 1, pageSize: PAGE_SIZE })))
    await flush()

    expect(hasSkeleton()).toBe(false)
    expect(codes()[0]).toBe("CUST-1")
    expect(codes()).toHaveLength(10)

    // The very first request already uses the measured page size: nothing is fetched twice.
    const firstPageCalls = get.mock.calls.filter(([, query]) => (query as Query).page === 1)
    expect(firstPageCalls).toHaveLength(1)
    expect(firstPageCalls[0][1]).toMatchObject({ page: 1, pageSize: PAGE_SIZE })
  })

  it("serves a prefetched page instantly and shows a skeleton for a page it has not got yet", async () => {
    vi.spyOn(api, "get").mockImplementation((_path, query) => {
      const request = query as Query
      // Page 3 never answers, so its loading state stays on screen.
      if (request.page === 3) return new Promise(() => {}) as never
      return Promise.resolve(pageOf(request)) as never
    })

    await render()
    await flush()
    expect(codes()[0]).toBe("CUST-1")

    // Page 2 was fetched ahead while page 1 was on screen.
    await click("Next")
    expect(hasSkeleton()).toBe(false)
    expect(codes()[0]).toBe("CUST-11")

    await click("Next")
    expect(hasSkeleton()).toBe(true)
    expect(container.textContent).toContain("Page 3 of 3")
  })

  it("does not wait on a timer: a search request leaves in the same tick", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockImplementation((_path, query) => Promise.resolve(pageOf(query as Query)) as never)

    await render()
    await flush()
    get.mockClear()

    const input = container.querySelector<HTMLInputElement>("input")!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "acme")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(get).toHaveBeenCalledWith("/customers/lookup", {
      search: "acme",
      page: 1,
      pageSize: PAGE_SIZE,
    })
  })
})
