import Field from "../../../../components/ui/Field"
import Textarea from "../../../../components/ui/Textarea"
import { useTranslation } from "../../../../i18n/I18nProvider"

export type StepNotesProps = {
  notes: string
  onChange: (notes: string) => void
}

/** Step 5: the free text notes printed under the offer. */
export default function StepNotes({ notes, onChange }: StepNotesProps) {
  const { t } = useTranslation()

  return (
    <Field
      label={t("offers.builder.notes.label")}
      hint={t("offers.builder.notes.hint")}
      htmlFor="offer-notes"
    >
      <Textarea
        id="offer-notes"
        rows={8}
        value={notes}
        placeholder={t("offers.builder.notes.placeholder")}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}
