export type ParsedRow = {
  /** Spreadsheet row number: the header is 1, so the first data row is 2. */
  rowNumber: number
  values: Record<string, string | null>
}

type CsvRecord = {
  line: number
  cells: string[]
}

/** Minimal RFC 4180 reader: quoted cells, escaped quotes, CRLF and a UTF-8 BOM. */
export function parseCsv(text: string): ParsedRow[] {
  const records = tokenize(text.replace(/^\uFEFF/, ""))
  if (records.length === 0) return []

  const headers = records[0].cells.map((header) => header.trim())
  const rows: ParsedRow[] = []

  for (const record of records.slice(1)) {
    if (record.cells.every((cell) => cell.trim() === "")) continue

    const values: Record<string, string | null> = {}
    headers.forEach((header, index) => {
      if (!header) return
      const cell = record.cells[index]?.trim()
      values[header] = cell ? cell : null
    })
    rows.push({ rowNumber: record.line, values })
  }

  return rows
}

/** Serializes rows with CRLF line endings and proper quoting. */
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const escape = (value: string | number | null | undefined) => {
    const text = value == null ? "" : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  return (
    [headers, ...rows]
      .map((record) => record.map(escape).join(","))
      .join("\r\n") + "\r\n"
  )
}

export type ErrorRow = {
  rowNumber: number
  errors: string[]
  values: Record<string, string | null>
}

/** The "errors" download: row number, messages and the original values. */
export function errorsCsv(columns: string[], rows: ErrorRow[]): string {
  return toCsv(
    ["rowNumber", "errors", ...columns],
    rows.map((row) => [
      row.rowNumber,
      row.errors.join(" | "),
      ...columns.map((column) => row.values[column] ?? ""),
    ]),
  )
}

/** Saves CSV text as a file, with a BOM so Excel keeps Arabic text intact. */
export function downloadCsv(fileName: string, csv: string): void {
  const content = csv.startsWith("\uFEFF") ? csv : `\uFEFF${csv}`
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function tokenize(text: string): CsvRecord[] {
  const records: CsvRecord[] = []
  let cells: string[] = []
  let cell = ""
  let inQuotes = false
  let line = 1
  let recordLine = 1

  const endCell = () => {
    cells.push(cell)
    cell = ""
  }

  const endRecord = () => {
    endCell()
    records.push({ line: recordLine, cells })
    cells = []
    recordLine = line + 1
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        if (char === "\n") line += 1
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      endCell()
    } else if (char === "\r") {
      // CRLF is handled by the \n branch; a lone \r is ignored.
    } else if (char === "\n") {
      endRecord()
      line += 1
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || cells.length > 0) {
    endRecord()
  }

  return records
}
