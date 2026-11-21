// @vitest-environment jsdom
import { describe, expect, it } from "vitest"

import { localizeDigits, toArabicDigits } from "./arabicDigits"

describe("toArabicDigits", () => {
  it("writes digits, separators and percent in Arabic", () => {
    expect(toArabicDigits("1,234.50")).toBe("١٬٢٣٤٫٥٠")
    expect(toArabicDigits("14%")).toBe("١٤٪")
    expect(toArabicDigits("21/11/2026")).toBe("٢١/١١/٢٠٢٦")
  })

  it("leaves text without digits and sentence punctuation alone", () => {
    expect(toArabicDigits("Total, due.")).toBe("Total, due.")
    expect(toArabicDigits("ينتهي خلال 30 يوم.")).toBe("ينتهي خلال ٣٠ يوم.")
  })
})

describe("localizeDigits", () => {
  it("skips everything under a data-latin element", () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <p id="a">الإجمالي 1,500</p>
      <span id="ref" data-latin>Loc/42/YL/JD</span>
      <table data-latin><tr><td><b id="iban">EG12 0003</b></td></tr></table>
      <span id="item" data-latin>Foam 25kg</span>`
    localizeDigits(root)

    expect(root.querySelector("#a")?.textContent).toBe("الإجمالي ١٬٥٠٠")
    expect(root.querySelector("#ref")?.textContent).toBe("Loc/42/YL/JD")
    expect(root.querySelector("#iban")?.textContent).toBe("EG12 0003")
    expect(root.querySelector("#item")?.textContent).toBe("Foam 25kg")
  })

  it("wraps each number in a span styled with the letterhead font", () => {
    const root = document.createElement("div")
    root.innerHTML = "<p>صلاحية 7 أيام — حتى 28/10/2026</p>"
    localizeDigits(root)

    const spans = Array.from(root.querySelectorAll(".doc-ar-num")).map((span) => span.textContent)
    expect(spans).toEqual(["٧", "٢٨/١٠/٢٠٢٦"])
    expect(root.textContent).toBe("صلاحية ٧ أيام — حتى ٢٨/١٠/٢٠٢٦")
  })
})
