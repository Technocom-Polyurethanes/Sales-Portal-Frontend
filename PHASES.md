# Build phases

The application is built in five phases. Every phase ends with a working build,
a passing type check and passing tests, and is reviewed before the next one
starts.

## Phase 1 — Foundation and app shell (done)

- Removed the design tooling and the single page prototype export: its build
  plugins, its HTML placeholders and the package naming are gone. The first
  design is archived read-only in `../design-reference`.
- Created the folder structure: `app`, `components/ui`, `features`, `pdf`,
  `lib`, `i18n`, `mock`.
- `lib/calculations` with unit tests: packaging, tax, the subtractive
  "other tax", due date, reference number (month taken from the issue date).
- `lib/formatters` for numbers, currency and dates.
- `i18n` with `en.json`, `ar.json`, direction handling, and a separate PDF
  language setting.
- `mock` sample data behind a swappable API layer (`lib/api` + transport
  registry) so the backend can replace it.
- `components/ui` kit and the `app` shell: router, providers, sidebar, top
  bar, login screen, footer, mobile bottom bar.
- The offers list and the dashboard already run on the mock API.

## Phase 2 — Offers and the printed document (done)

- Five step offer builder (basics, materials and packaging, taxes and totals,
  delivery schedule, notes) with live calculations.
- The document preview updates on every field change, in the language of the
  document.
- Offer list with filters, search and status handling.
- Offer details with version history, status changes, duplication and a
  review dialog before issuing.
- `src/pdf` holds the printed offer: `OfferDocument`, the English and Arabic
  templates, the section components, the A4 styles and the print rules.
- The Arabic document is a full mirror of the English one: the container
  switches to right to left, every block and every table flips, and the
  packaging names are translated. Only the reference number keeps its own
  direction.
- Bank table always visible, optional notes, conditional tax, deduction,
  advance and balance rows.
- Print styles with pagination safeguards and repeated table headers.

## Phase 3 — Customers, products, import, settings, account

- Customer directory and customer history with mixed packaging summaries.
- Materials library with default packaging and alternative size guidance.
- Data import flow (upload, match columns, check and import).
- Settings: company, package types, bank accounts, reminders, document
  preferences. Terms and conditions and chairman details stay removed.
- My account with the application language, the PDF language and text size.

## Phase 4 — Document comparison and finishing touches

- Side by side Arabic and English comparison view of the same offer.
- Document preferences (letterhead, signature block options) once confirmed.

## Phase 5 — Polish and verification

- Responsive refinements for mobile, tablet and desktop.
- Accessibility pass, empty and error states, final QA.
- Type check, production build and the full test suite.
