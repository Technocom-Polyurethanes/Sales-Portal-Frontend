/**
 * Splits the offer document into real A4 sheets.
 *
 * The document components render once, into a detached `source` element. The
 * blocks found there are copied page by page into `target`, and a block is
 * only kept on a page when the browser confirms that it still fits. Every page
 * gets its own copy of the letterhead header and of the footer.
 *
 * Source markup contract:
 * - `[data-doc-part="header"]` and `[data-doc-part="footer"]` wrap the elements
 *   repeated on every page.
 * - every `[data-doc-unit]` wraps one block of the body, in print order. A
 *   block that holds a table is split between pages, row by row, and the
 *   heading and the column headings are repeated on the next page.
 */

const MM_PX = 96 / 25.4

/** Space kept free between the last block of a page and the footer. */
const BOTTOM_GAP_PX = 4 * MM_PX

/** Tolerance for the sub pixel rounding of the browser layout. */
const TOLERANCE_PX = 0.5

/** Fewest row groups a table keeps on each side of a page break. */
const MIN_SPLIT_ROWS = 2

type Unit = {
  element: HTMLElement
  /** Kept in one piece when it can fit on a page of its own. */
  keep: boolean
}

type Parts = {
  header: HTMLElement | null
  footer: HTMLElement | null
  units: Unit[]
}

function readParts(source: HTMLElement): Parts {
  const wrappers = Array.from(source.children)
  const rootOf = (wrapper?: Element): HTMLElement | null =>
    (wrapper?.firstElementChild as HTMLElement | null | undefined) ?? null
  const part = (name: string) =>
    rootOf(wrappers.find((child) => child.getAttribute("data-doc-part") === name))

  const units = wrappers
    .filter((child) => child.hasAttribute("data-doc-unit"))
    .map((child) => ({
      element: rootOf(child),
      keep: child.hasAttribute("data-doc-keep"),
    }))
    .filter((unit): unit is Unit => unit.element !== null)

  return { header: part("header"), footer: part("footer"), units }
}

/** True while the last block of the page ends above the free space limit. */
function fits(body: HTMLElement): boolean {
  // Without a layout (a detached or hidden tree) nothing can be measured.
  if (body.clientHeight === 0) return true

  const last = body.lastElementChild as HTMLElement | null
  if (!last) return true

  const marginBottom = parseFloat(getComputedStyle(last).marginBottom) || 0
  const bottom = last.offsetTop + last.offsetHeight + marginBottom
  return bottom <= body.clientHeight - BOTTOM_GAP_PX + TOLERANCE_PX
}

/**
 * Rows that can never be separated: a material and its packaging line, the
 * last delivery and the total row below it.
 */
function groupRows(tbody: HTMLTableSectionElement): HTMLTableRowElement[][] {
  const groups: HTMLTableRowElement[][] = []

  for (const row of Array.from(tbody.rows)) {
    const attached =
      row.classList.contains("doc-subrow") ||
      row.classList.contains("doc-total-row")

    if (attached && groups.length > 0) groups[groups.length - 1].push(row)
    else groups.push([row])
  }

  return groups
}

function createPage(
  target: HTMLElement,
  parts: Parts,
  continued: boolean,
): HTMLElement {
  const doc = target.ownerDocument
  const page = doc.createElement("section")
  page.className = continued ? "doc-page doc-page--continued" : "doc-page"
  page.dataset.page = String(target.childElementCount + 1)

  const body = doc.createElement("div")
  body.className = "doc-page__body"

  if (parts.header) page.append(parts.header.cloneNode(true))
  page.append(body)
  if (parts.footer) page.append(parts.footer.cloneNode(true))

  target.append(page)
  return body
}

/** Copy of a table block that only holds the given rows. */
function fragmentOf(unit: HTMLElement, rows: HTMLTableRowElement[]): HTMLElement {
  const fragment = unit.cloneNode(true) as HTMLElement
  fragment
    .querySelector("tbody")
    ?.replaceChildren(...rows.map((row) => row.cloneNode(true)))
  return fragment
}

/**
 * Fills `target` with A4 sheets built from `source`.
 * Returns the number of pages.
 */
export function paginate(source: HTMLElement, target: HTMLElement): number {
  const parts = readParts(source)
  target.replaceChildren()

  let body = createPage(target, parts, false)
  const nextPage = () => {
    body = createPage(target, parts, true)
  }

  const placeBlock = (unit: HTMLElement) => {
    const copy = unit.cloneNode(true) as HTMLElement
    body.append(copy)

    // A block that is alone on its page cannot be placed any better.
    if (fits(body) || body.childElementCount === 1) return

    copy.remove()
    nextPage()
    body.append(unit.cloneNode(true))
  }

  /**
   * Places a block in one piece: on the current page when it fits, otherwise
   * on the next one. Returns false, and places nothing, when the block is
   * taller than a page of its own, so the caller can split it.
   */
  const placeWhole = (unit: HTMLElement): boolean => {
    const copy = unit.cloneNode(true) as HTMLElement
    body.append(copy)
    if (fits(body)) return true

    copy.remove()
    const wasEmpty = body.childElementCount === 0

    if (!wasEmpty) nextPage()
    const fresh = unit.cloneNode(true) as HTMLElement
    body.append(fresh)
    if (fits(body)) return true

    // Too tall for a page: undo, and leave the empty page for the split.
    fresh.remove()
    return false
  }

  const placeTable = (unit: HTMLElement, groups: HTMLTableRowElement[][]) => {
    let start = 0

    while (start < groups.length) {
      const fragment = fragmentOf(unit, groups[start])
      body.append(fragment)

      // Not even the first rows fit: start the block on a fresh page.
      if (!fits(body) && body.childElementCount > 1) {
        fragment.remove()
        nextPage()
        continue
      }

      const tbody = fragment.querySelector("tbody") as HTMLTableSectionElement
      let end = start + 1

      while (end < groups.length) {
        const added = groups[end].map((row) =>
          tbody.appendChild(row.cloneNode(true) as HTMLTableRowElement),
        )
        if (!fits(body)) {
          added.forEach((row) => row.remove())
          break
        }
        end += 1
      }

      if (end < groups.length) {
        // The table is split here. Never leave a single row alone on the next
        // page (widow) ...
        end = Math.min(end, groups.length - MIN_SPLIT_ROWS)

        // ... nor a single row under the heading at the bottom of this page
        // (orphan): the whole rest of the table starts on a fresh page.
        if (end - start < MIN_SPLIT_ROWS && body.childElementCount > 1) {
          fragment.remove()
          nextPage()
          continue
        }

        end = Math.max(end, start + 1)
        tbody.replaceChildren(
          ...groups
            .slice(start, end)
            .flat()
            .map((row) => row.cloneNode(true)),
        )
      }

      start = end
      if (start < groups.length) nextPage()
    }
  }

  for (const { element: unit, keep } of parts.units) {
    const table = (
      unit.matches("table") ? unit : unit.querySelector("table")
    ) as HTMLTableElement | null
    const tbody = table?.tBodies[0]
    const groups = tbody ? groupRows(tbody) : []

    if (groups.length <= 1) {
      placeBlock(unit)
    } else if (keep && placeWhole(unit)) {
      continue
    } else {
      placeTable(unit, groups)
    }
  }

  return target.childElementCount
}
