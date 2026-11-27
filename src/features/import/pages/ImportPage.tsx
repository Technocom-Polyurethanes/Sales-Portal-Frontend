import { useEffect, useState } from "react"

import PageHeader from "../../../app/layout/PageHeader"
import Button from "../../../components/ui/Button"
import Card from "../../../components/ui/Card"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../i18n/types"
import { downloadCsv, errorsCsv } from "../../../lib/import/csv"
import { IMPORT_COLUMNS } from "../../../lib/import/columns"
import FileDropzone from "../components/FileDropzone"
import HistoryTable from "../components/HistoryTable"
import PreviewTable from "../components/PreviewTable"
import ResultSummary from "../components/ResultSummary"
import SourcePicker from "../components/SourcePicker"
import { useImportFlow } from "../hooks/useImportFlow"
import { useImportHistory } from "../hooks/useImportHistory"

const STEPS: TranslationKey[] = [
  "import.steps.source",
  "import.steps.preview",
  "import.steps.confirm",
]

export default function ImportPage() {
  const { t } = useTranslation()
  const flow = useImportFlow()
  const [page, setPage] = useState(1)
  const history = useImportHistory(page)

  useEffect(() => {
    if (flow.result) history.reload()
    // The result only changes once per commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.result])

  const downloadErrors = () => {
    if (!flow.source || !flow.preview) return
    const rows = flow.preview.rows.filter((row) => row.status === "error")
    downloadCsv(
      "import-errors.csv",
      errorsCsv(IMPORT_COLUMNS[flow.source], rows),
    )
  }

  return (
    <>
      <PageHeader title={t("import.title")} subtitle={t("import.subtitle")} />

      <div className="flex flex-col gap-6">
        <Card>
          <ol className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium">
            {STEPS.map((key, index) => {
              const number = index + 1
              const current = flow.step === number
              return (
                <li
                  key={key}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-2 ${
                    current ? "text-primary" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      current ? "border-primary bg-primary-soft" : "border-line"
                    }`}
                  >
                    {number}
                  </span>
                  {t(key)}
                  {number < STEPS.length && (
                    <span className="text-line">—</span>
                  )}
                </li>
              )
            })}
          </ol>

          {flow.error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {flow.error.message}
            </div>
          )}

          {flow.step === 1 && (
            <div className="flex flex-col gap-5">
              <SourcePicker
                value={flow.source}
                onChange={flow.chooseSource}
                onDownload={flow.downloadTemplate}
                downloading={flow.busy === "template"}
              />

              {flow.source && (
                <FileDropzone
                  onFile={flow.upload}
                  disabled={flow.busy === "preview"}
                />
              )}

              {flow.busy === "preview" && flow.progress && (
                <div className="rounded-lg border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-ink">
                      {flow.progress.percent === 100
                        ? t("import.readingFile")
                        : t("import.uploading", { fileName: flow.fileName })}
                    </span>
                    <span className="text-muted">
                      {flow.progress.percent}%
                      {flow.progress.etaSeconds !== null &&
                        ` · ${t("import.secondsLeft", {
                          seconds: flow.progress.etaSeconds,
                        })}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={t("import.uploading", {
                      fileName: flow.fileName,
                    })}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={flow.progress.percent}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-line-soft"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
                      style={{ width: `${flow.progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {flow.step === 2 && flow.source && flow.preview && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    {t("import.previewTitle")}
                  </h2>
                  <p className="text-sm text-muted">{flow.fileName}</p>
                </div>
              </div>

              <PreviewTable
                source={flow.source}
                preview={flow.preview}
                onDownloadErrors={downloadErrors}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  onClick={flow.commit}
                  loading={flow.busy === "commit"}
                >
                  {t("import.confirmImport")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={flow.back}
                  disabled={flow.busy === "commit"}
                >
                  {t("import.cancel")}
                </Button>
              </div>
            </div>
          )}

          {flow.step === 3 && flow.result && (
            <ResultSummary result={flow.result} onRestart={flow.reset} />
          )}
        </Card>

        <HistoryTable
          history={history.data}
          loading={history.loading}
          error={history.error}
          onRetry={history.reload}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}
