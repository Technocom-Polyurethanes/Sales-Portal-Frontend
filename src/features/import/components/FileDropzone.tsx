import { useRef, useState } from "react"
import type { DragEvent, KeyboardEvent } from "react"

import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import { checkImportFile, type FileProblem } from "../../../lib/import/file"

const PROBLEM_KEYS: Record<FileProblem, TranslationKey> = {
  extension: "import.fileWrongType",
  size: "import.fileTooLarge",
  empty: "import.fileEmpty",
}

export type FileDropzoneProps = {
  onFile: (file: File) => void
  disabled?: boolean
}

/** Drag and drop, or the native file picker. Validates before uploading. */
export default function FileDropzone({
  onFile,
  disabled = false,
}: FileDropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [problem, setProblem] = useState<FileProblem | null>(null)

  const accept = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const found = checkImportFile(file)
    setProblem(found)
    if (!found) onFile(file)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) accept(event.dataTransfer.files)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={onKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary-soft"
            : "border-line bg-page hover:border-primary/50"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <Icon name="upload" size={26} className="text-primary" />
        <span className="text-sm font-medium text-ink">
          {t("import.dropFile")}
        </span>
        <span className="text-xs text-muted">{t("import.orBrowse")}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => accept(event.target.files)}
        />
      </label>

      <p role="alert" aria-live="polite" className="text-xs text-danger">
        {problem ? t(PROBLEM_KEYS[problem]) : ""}
      </p>
    </div>
  )
}
