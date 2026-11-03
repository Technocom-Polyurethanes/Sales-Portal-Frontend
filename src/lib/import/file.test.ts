import { describe, expect, it } from "vitest"

import { checkImportFile, MAX_IMPORT_BYTES } from "./file"

describe("checkImportFile", () => {
  it("accepts an .xlsx or .csv file under 5 MB", () => {
    expect(checkImportFile({ name: "customers.xlsx", size: 1024 })).toBeNull()
    expect(checkImportFile({ name: "PRICES.CSV", size: 1024 })).toBeNull()
  })

  it("rejects another extension, an oversized file and an empty file", () => {
    expect(checkImportFile({ name: "customers.xls", size: 1024 })).toBe(
      "extension",
    )
    expect(
      checkImportFile({ name: "customers.csv", size: MAX_IMPORT_BYTES + 1 }),
    ).toBe("size")
    expect(checkImportFile({ name: "customers.csv", size: 0 })).toBe("empty")
  })
})
