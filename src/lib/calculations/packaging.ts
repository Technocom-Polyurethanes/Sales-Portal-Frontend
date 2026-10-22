import { roundMoney } from "./round"

export type PackageTypeId = string

export type PackageType = {
  id: PackageTypeId
  name: string
  nameAr: string
  defaultWeightKg: number
}

/** A single packaging row: how many packages of which type and weight. */
export type PackagingLine = {
  id: string
  packageTypeId: PackageTypeId
  packageTypeName: string
  weightPerPackageKg: number
  packages: number
}

export type PackagingBreakdown = {
  packageTypeId: PackageTypeId
  packageTypeName: string
  weightPerPackageKg: number
  packages: number
  quantityKg: number
}

/** Weight carried by one packaging row. */
export function lineQuantityKg(line: PackagingLine): number {
  const weight = Number.isFinite(line.weightPerPackageKg)
    ? line.weightPerPackageKg
    : 0
  const count = Number.isFinite(line.packages) ? line.packages : 0
  return roundMoney(weight * count)
}

/** Total kilograms across every packaging row of a material. */
export function totalQuantityKg(lines: PackagingLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineQuantityKg(line), 0))
}

/** Total number of packages across every packaging row of a material. */
export function totalPackages(lines: PackagingLine[]): number {
  return lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.packages) ? line.packages : 0),
    0,
  )
}

/** Groups the packaging rows by package type and weight. */
export function packagingBreakdown(
  lines: PackagingLine[],
): PackagingBreakdown[] {
  const grouped = new Map<string, PackagingBreakdown>()

  for (const line of lines) {
    const key = `${line.packageTypeId}@${line.weightPerPackageKg}`
    const existing = grouped.get(key)
    if (existing) {
      existing.packages += line.packages
      existing.quantityKg = roundMoney(
        existing.quantityKg + lineQuantityKg(line),
      )
      continue
    }

    grouped.set(key, {
      packageTypeId: line.packageTypeId,
      packageTypeName: line.packageTypeName,
      weightPerPackageKg: line.weightPerPackageKg,
      packages: line.packages,
      quantityKg: lineQuantityKg(line),
    })
  }

  return [...grouped.values()]
}

/** `10 Drums × 210 kg` */
export function formatPackagingLine(line: PackagingLine): string {
  return `${line.packages} ${line.packageTypeName} × ${line.weightPerPackageKg} kg`
}

/** `10 Drums × 210 kg + 4 Pails × 25 kg` */
export function formatPackagingSummary(lines: PackagingLine[]): string {
  return lines.map(formatPackagingLine).join(" + ")
}

/** `19 packages` / `1 package` */
export function formatPackageCount(packages: number): string {
  return `${packages} ${packages === 1 ? "package" : "packages"}`
}
