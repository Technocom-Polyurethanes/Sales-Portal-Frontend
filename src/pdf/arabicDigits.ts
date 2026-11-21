/**
 * Arabic-Indic numerals for the Arabic document.
 *
 * The document is written with Latin digits everywhere. Once it is rendered, `localizeDigits`
 * rewrites every number of a copy of it into Arabic-Indic digits, with the Arabic decimal and
 * thousands separators. Anything inside an element marked `data-latin` is left untouched: the
 * form code, the reference number, the product names, the bank details and the letterhead.
 */

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/** Marks an element whose digits must stay Latin. */
export const KEEP_LATIN_ATTRIBUTE = "data-latin"

/** Arabic-Indic digits, separators and percent sign for a piece of text. */
export function toArabicDigits(text: string): string {
  return text
    .replace(/(?<=\d)\.(?=\d)/g, "٫")
    .replace(/(?<=\d),(?=\d)/g, "٬")
    .replace(/(?<=\d)\s?%/g, "٪")
    .replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)])
}

/** Rewrites the numbers of every text node under `root`, except under `data-latin` elements. */
export function localizeDigits(root: HTMLElement): void {
  const doc = root.ownerDocument
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push(node as Text)
  }

  for (const node of nodes) {
    const value = node.nodeValue ?? ""
    if (!/\d/.test(value)) continue
    if (node.parentElement?.closest(`[${KEEP_LATIN_ATTRIBUTE}]`)) continue
    node.nodeValue = toArabicDigits(value)
  }
}
