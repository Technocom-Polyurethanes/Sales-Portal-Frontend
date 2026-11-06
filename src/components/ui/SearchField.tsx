import Icon from "./Icon"

export type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** Search box with a leading icon, shared by the catalogue pages. */
export default function SearchField({
  value,
  onChange,
  placeholder,
}: SearchFieldProps) {
  return (
    <div className="relative w-full sm:w-72">
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">
        <Icon name="search" size={17} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-md border border-line bg-surface ps-9 pe-3 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary"
      />
    </div>
  )
}
