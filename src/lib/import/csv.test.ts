import { describe, expect, it } from "vitest"

import { errorsCsv, parseCsv, toCsv } from "./csv"

describe("parseCsv", () => {
  it("parses a header and rows with spreadsheet row numbers", () => {
    const rows = parseCsv("code,name\r\nA,First\r\nB,Second\r\n")

    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      rowNumber: 2,
      values: { code: "A", name: "First" },
    })
    expect(rows[1].rowNumber).toBe(3)
  })

  it("keeps a BOM, quoted commas, quotes and Arabic text intact", () => {
    const rows = parseCsv(
      '\uFEFFcode,name,address\r\nCUST-1,"شركة, أو","10th, ""Main"" St"\r\n',
    )

    expect(rows[0].values.name).toBe("شركة, أو")
    expect(rows[0].values.address).toBe('10th, "Main" St')
  })

  it("skips blank lines and empty cells become null", () => {
    const rows = parseCsv("code,name\r\nA,\r\n\r\nB,Two\r\n")

    expect(rows).toHaveLength(2)
    expect(rows[0].values.name).toBeNull()
    expect(rows[1].rowNumber).toBe(4)
  })

  it("returns no rows for a header-only file", () => {
    expect(parseCsv("code,name\r\n")).toEqual([])
  })
})

describe("toCsv", () => {
  it("quotes values that contain separators and doubles quotes", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'say "hi"']])

    expect(csv).toBe('a,b\r\n"x,y","say ""hi"""\r\n')
  })
})

describe("errorsCsv", () => {
  it("writes the row number, messages and the original values", () => {
    const csv = errorsCsv(["itemCode", "name"], [
      {
        rowNumber: 4,
        errors: ["Name is required."],
        values: { itemCode: "MAT-1", name: null },
      },
    ])

    expect(csv).toContain("rowNumber,errors,itemCode,name")
    expect(csv).toContain("4,Name is required.,MAT-1,")
  })
})
