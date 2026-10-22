import { describe, expect, it } from "vitest"

import {
  formatPackagingSummary,
  lineQuantityKg,
  packagingBreakdown,
  totalPackages,
  totalQuantityKg,
  type PackagingLine,
} from "./packaging"

const drumRow: PackagingLine = {
  id: "row-1",
  packageTypeId: "drum",
  packageTypeName: "Drum",
  weightPerPackageKg: 210,
  packages: 19,
}

const isoRows: PackagingLine[] = [
  {
    id: "row-2",
    packageTypeId: "drum",
    packageTypeName: "Drum",
    weightPerPackageKg: 250,
    packages: 10,
  },
  {
    id: "row-3",
    packageTypeId: "pail",
    packageTypeName: "Pail",
    weightPerPackageKg: 25,
    packages: 4,
  },
]

describe("packaging calculations", () => {
  it("multiplies the package weight by the number of packages", () => {
    expect(lineQuantityKg(drumRow)).toBe(3990)
  })

  it("adds mixed packaging rows of the same material", () => {
    expect(totalQuantityKg(isoRows)).toBe(2600)
    expect(totalPackages(isoRows)).toBe(14)
  })

  it("returns zero for empty packaging", () => {
    expect(totalQuantityKg([])).toBe(0)
    expect(totalPackages([])).toBe(0)
  })

  it("groups packaging rows by package type and weight", () => {
    const breakdown = packagingBreakdown([...isoRows, drumRow])
    const heavyDrums = breakdown.find(
      (entry) =>
        entry.packageTypeId === "drum" && entry.weightPerPackageKg === 250,
    )
    const lightDrums = breakdown.find(
      (entry) =>
        entry.packageTypeId === "drum" && entry.weightPerPackageKg === 210,
    )

    expect(heavyDrums?.packages).toBe(10)
    expect(heavyDrums?.quantityKg).toBe(2500)
    expect(lightDrums?.packages).toBe(19)
    expect(lightDrums?.quantityKg).toBe(3990)
  })

  it("describes a packaging row", () => {
    expect(formatPackagingSummary(isoRows)).toBe(
      "10 Drum × 250 kg + 4 Pail × 25 kg",
    )
  })
})
