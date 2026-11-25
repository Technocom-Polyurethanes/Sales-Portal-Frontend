# TECHNOCOM Sales Portal — frontend

Internal workspace for the TECHNOCOM sales team to create, calculate, save, version, search and
print quotations / proforma offers (عروض الأسعار).

This repository contains the **React frontend only**. The ASP.NET Core 8 + PostgreSQL backend lives
in `../backend/Sales Portal`; its endpoint contract is documented in
[the backend API reference](../backend/Sales%20Portal/docs/API.md).

The app is bilingual in two independent senses: the **workspace** follows the user's language, and
each **printed offer** stores its own English or Arabic document language.

## Contents

- [What the application does](#what-the-application-does)
- [Get started](#get-started)
- [How the application works](#how-the-application-works)
- [Offer rules](#offer-rules)
- [Printing and languages](#printing-and-languages)
- [Repository layout](#repository-layout)
- [Tests, CI and deployment](#tests-ci-and-deployment)
- [Common changes](#common-changes)
- [Current state and gotchas](#current-state-and-gotchas)
- [Further reading](#further-reading)

---

## What the application does

| Area | What users can do |
| --- | --- |
| Offers | Build an offer in five steps, see totals and a live A4 preview, save a draft, issue it, change status, revise it into a new version and print it. |
| Search | Filter and search offers, view a customer's offer history and browse the version chain of an offer. |
| Reference data | Manage customers, materials (with packaging options) and bank accounts. |
| Import | Upload CSV files, match columns, preview the result and commit an import. |
| Administration | Manage users and roles; `Admin`, `Sales` and `Accountant` see different actions. |
| Languages | Switch the workspace between English and Arabic, independently of the printed document language. |

**Terms used in this document**

| Term | Meaning |
| --- | --- |
| Offer | A quotation / proforma offer; the main business object. |
| Workspace | The application UI that surrounds the document. |
| Document | The paginated A4 offer that is previewed and printed. |
| Draft | A saved but not issued offer. A draft needs only a customer, at least one material line and a bank. |
| Version | A revised copy of an offer, linked to its parent through `parentOfferId`. |

---

## Get started

Requirements: **Node 22** and **pnpm 10** (see [.mise.toml](.mise.toml)).

```bash
cp .env.example .env       # point VITE_API_BASE_URL at the backend
pnpm install
pnpm dev                   # Vite on $PORT, default 8443
```

A dev server is already running in this development environment on `$PORT` (default `8443`); use
the preview panel. Source changes hot-reload.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server (`host: true`, `strictPort: true`) |
| `pnpm build` | Production bundle |
| `pnpm preview` | Serve the built bundle |
| `pnpm typecheck` | Strict TypeScript check (`tsc --noEmit`) |
| `pnpm test` / `pnpm test:watch` | Vitest, once / watch |
| `pnpm format` | Format sources with oxfmt |

### Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend base URL, for example `http://localhost:5065/api`. A trailing `/api` added by the client is normalised, so it will not be doubled. |
| `VITE_USE_MOCK` | `true` runs against the in-browser mock instead of the backend. |
| `VITE_API_MODE` | Alternative to `VITE_USE_MOCK`: set to `mock` for mock mode. |
| `PORT` | Dev and preview server port, default `8443`. |

**Mock mode:** set `VITE_USE_MOCK=true` in `.env` to run without a backend. The mock is an
in-memory, non-persistent database; reloading the page restores the seed data. Any non-empty
credentials sign in, as the user selected in `src/mock/db.ts` (Admin by default). Vitest forces
mock mode in `vite.config.ts`, so tests never call a real API. CI and production builds set
`VITE_USE_MOCK=false` and require `VITE_API_BASE_URL`. Never commit `.env`.

`srs.md` is the original specification and useful for intent and domain background, but it is **not**
an implementation description: it names React 18, TanStack Query/Table, React Hook Form + Zod and
`react-to-print`. The code uses React 19, a small in-house query cache, controlled forms and a print
portal. Trust the code and this README for current behaviour.

---

## How the application works

### Boot, routes and access control

```text
index.html → src/main.tsx → src/app/App.tsx → AppProviders → AppRouter → AppShell
```

`App.tsx` selects the API transport at startup: the mock when `VITE_USE_MOCK === "true"` or
`VITE_API_MODE === "mock"`, otherwise HTTP. The transport is registered once; feature code does not
know which one is active.

Providers, outermost first (in `src/app/providers/AppProviders.tsx`):

1. `I18nProvider` — workspace language and text direction.
2. `PdfLanguageProvider` — independent document language.
3. `ToastProvider` — notifications, positioned according to the workspace direction.
4. `SessionProvider` — login, user profile and permissions.
5. `LiveUpdates` — keeps the backend event stream open while signed in.
6. `PrintProvider` — renders the printable document in a portal outside the app.
7. `BrowserRouter` — then `AppRouter`.

If nobody is signed in, **every URL** shows the login screen; successful login navigates to `/`.
A `401` response clears `sales_portal_jwt` and `technocom.session` and redirects to `/login`.
Signing out also clears the in-memory query cache.

Authenticated routes are rendered inside `AppShell`:

| Path | Page | Route guard |
| --- | --- | --- |
| `/` | Dashboard | — |
| `/offers` | Offer list | — |
| `/offers/new` | Offer builder | `offers.write` |
| `/offers/:id` | Offer details, versions, status, print | — |
| `/customers`, `/customers/:id` | Customer directory and history | — |
| `/products`, `/banks` | Materials and bank accounts | — |
| `/import` | Import wizard | `import.use` |
| `/users` | User management | `users.manage` |
| `/settings`, `/account` | Placeholder screens | — |
| `/home`, `/login` | Redirect to `/` | — |
| `*` | Not found | — |

Roles and permissions mirror the backend policy matrix (`Policies.cs`). Route guards cover only the
three paths above; other write actions are hidden per page with `usePermissions().can(...)` and
enforced again by the API.

| Role | Permissions |
| --- | --- |
| Admin | Everything |
| Sales | Create/revise/status-change offers, delete offers, create customers/materials/banks, delete them |
| Accountant | Create, edit and delete catalogue data; import data; offers are read-only |

Source: `src/features/account/permissions.ts`.

### Data flow

```text
page → feature api.ts → src/lib/api/client.ts → transport (mock | HTTP) → backend
                     ↘ src/lib/cache/queryCache.ts (tags + 2 minute TTL)
```

- **Feature modules call their own `api.ts` and never import mock data directly.**
- `Transport` is a single `(path, options) => Promise<unknown>` function. `registerTransport()`
  swaps implementations; the mock registers itself on import. The HTTP transport prefixes `/api/`,
  sends the bearer token, uses `XMLHttpRequest` only for upload progress, and throws `ApiError`
  with a status, detail and optional field errors.
- `queryCache.ts` caches reference data with the tags `customers`, `materials`, `banks` and
  `catalog`; writes invalidate the relevant tags. Failed requests are not cached, and stale
  in-flight responses are discarded.
- `useAsyncData()` supplies `{ data, loading, error, reload, refresh, mutate }`; `mutate()` returns a
  rollback function for optimistic updates. `useDelete()` shares confirmation, busy and toast
  behaviour. `PagedTable` + `TableState` render loading, empty, error and page states consistently.
- With the real backend, `LiveUpdates` opens one SSE connection to `GET /api/events`. Announcements
  invalidate cached reference data and refresh the affected visible screens; the client reconnects
  with backoff and polls while the stream is down. Mock mode has no server to listen to.

Endpoint groups (exact paths are in each `src/features/*/api.ts`): auth (`/auth/login`, `/auth/me`),
offers (`/offers`, `/offers/calculate`, `/offers/next-sequence`, `/offers/:id/versions`,
`POST /offers/:id/revise`, `PATCH /offers/:id/status`), customers (`/customers`, `/customers/:id/offers`,
`/customers/lookup`), materials (`/materials`, `/materials/lookup`), banks, settings/catalog, users,
and import (`/import/templates/:type`, `/import/:type/preview`, `/import/:id/commit`,
`/import/history`). The mock implements most routes with simulated latency; server calculation,
revise/update and lookup endpoints work against the backend only.

**Backend field mapping:** backend `materialId` ↔ frontend `productId` / line `materialId`,
`customerCode` ↔ `code`, `defaultPaymentTermId` ↔ `paymentTermId`, `itemCode` ↔ `code`,
`referencePricePerKg` ↔ `referencePrice`. Statuses arrive capitalised and are lowercased by
`features/offers/mappers.ts`. Settings arrive either flat (mock `/settings`) or as
`{ company, workspace: { bankAccounts, ... } }` (backend); `normalizeSettings()` merges both shapes
with `/catalog/bootstrap`.

---

## Offer rules

### Builder and lifecycle

The builder has five steps — `basics`, `packaging`, `taxes`, `delivery`, `notes` — validated in
`src/features/offers/stepValidation.ts`. A step after the first incomplete one is locked; going back
is always allowed; **Next** shows errors instead of advancing. **Save as draft** checks only the
issues that block a draft (customer, at least one line, bank); **issue** requires every step to be
complete. Issuing is `POST /offers` followed by `PATCH /offers/:id/status` with `issued` — there is no
special create payload.

Frontend statuses are `draft`, `issued`, `accepted` and `rejected`. The normal flow is
`Draft → Issued → Accepted | Rejected`; the backend also documents `Cancelled`. Deleting or revising
affects the whole version chain. **New version** opens `/offers/new?from=<id>` and prefills
`version + 1` with `parentOfferId`; `VersionHistory` lists versions newest first.

### Reference numbers

`{Loc|Int}/{0000 sequence}-{issue year}/YL/{initials}`, for example `Loc/0042-2026/YL/JD`.
The reference is never typed: offer type, global sequence, issue date and the user's initials build
it, and changing the type or date rewrites the relevant segments. The sequence is suggested by the
server; only the very first offer shows an input for choosing the starting number. Legacy references
without a year are still read for their sequence. See `src/lib/calculations/reference.ts`.

### Money and dates

Amounts are rounded to two decimals. The frontend rules in `src/lib/calculations` and
`src/features/offers/calculations.ts` are:

```text
lineQuantityKg = Σ (packages × weightPerPackageKg)   // a line may mix packaging types
lineAmount     = lineQuantityKg × ratePerKg × (1 - lineDiscountPercent / 100)
subtotal       = Σ lineAmount
netBeforeTax   = subtotal - orderDiscount + extraExpenses
taxAmount      = netBeforeTax × taxPercent / 100      // added
otherTaxAmount = netBeforeTax × 1 / 100               // fixed 1% deduction when enabled
total          = netBeforeTax + taxAmount - otherTaxAmount
balanceDue     = total - advancePayment
dueDate        = issueDate + paymentTerm.days
expiryDate     = issueDate + validityDays             // 0 hides the validity row
```

The backend calculator is authoritative for saved offers and does **not** store `extraExpenses`,
`advancePayment` or `balanceDue`. It rounds weights to three decimals, applies discounts at order
level (not per line), and clamps delivery allocations to the remaining packages of each packaging
row. The builder debounces `POST /offers/calculate` by 250 ms with cancellation, uses the server
response for the reference, due date and validation warnings, and keeps local `calculateDraft()`
for an instant preview.

### Delivery and banks

Delivery is free text or batches. Batches allocate packages per material/packaging row and track
ordered, scheduled and remaining quantities; helpers in `draft.ts` reconcile allocations when lines
change. At least one bank account must be selected; a new draft defaults to the first two active
accounts.

---

## Printing and languages

`src/pdf/` turns an offer into paginated A4 HTML printed by the browser.

- `OfferDocument.tsx` renders the document. `buildDocumentData()` / `offerToDocumentSource()` in
  `features/offers/document.ts` map stored offers, including `document.items` snapshots, into its
  input. Fixed labels live in `pdf/templates/en.ts` and `ar.ts`; one component per block lives in
  `pdf/sections/`; formatting lives in `format.ts` and `arabicDigits.ts`.
- Page metrics: sheet `210 × 297 mm`, margins `12.7 mm`, content `184.6 × 271.6 mm`. The preview
  renders a real sheet and scales the **whole sheet** (`OfferDocumentPreview.tsx`); never scale the
  document alone.
- `paginate.ts` splits pages, clones header/footer, repeats table headings and keeps sub-rows,
  totals, delivery/bank tables and terms unbroken.
- Arabic mirrors English: container `dir="rtl"`, logical CSS properties in `document.css`, Latin
  values isolated with `.doc-ltr`, and Arabic-Indic digits except inside `[data-latin]`. Do not put
  `direction: ltr` on a table cell; it would flip the meaning of `text-align: end`.
- **Never call `window.print()` from a page.** Use `usePrintOffer()` from `PrintProvider.tsx`: it
  renders the document into a `#print-root` portal outside `#root`, then prints. `print.css` hides
  the workspace and applies `@page { size: A4 portrait; margin: 0 }`.

Two unrelated language settings are persisted:

| Setting | Storage | Effect |
| --- | --- | --- |
| Workspace language (`src/i18n/`) | `technocom.app-language` | `en` (default) or `ar`; sets `<html lang>` and `dir`, changes the font, selects `en.json` / `ar.json` and switches toast placement. Keys are typed dot-paths derived from `en.json`; missing Arabic keys fall back to English. |
| Document language (`src/pdf/PdfLanguageProvider.tsx`) | `technocom.pdf-language` | `en` or `ar`; used for new drafts and printing. On the details page the toggle changes only the viewed/printed document, not the saved offer. |

---

## Repository layout

```text
src/
  main.tsx, index.css      React entrypoint and Tailwind v4 theme/base styles
  app/                     Router, providers and layout shell
    App.tsx                API transport registration
    providers/             Provider composition, live updates
    router.tsx, navigation.ts, RequirePermission.tsx
    layout/                Shell, sidebar, top bar, login, headers, footer
    pages/                 Not found and forbidden screens
  components/
    ui/                    Buttons, inputs, dialogs, tables, toasts, skeletons...
    pickers/               Customer and material search modals
    PagedTable.tsx         Table with loading/empty/error/pagination states
  features/
    offers/                Builder, list, details, calculations, draft mapping, statuses
    customers/, products/, banks/
    import/                CSV import wizard and history
    settings/, account/, users/
  lib/
    api/                   Typed client, transport registry, HTTP transport, errors
    calculations/          Pure offer maths and unit tests
    cache/, hooks/, live/  Query cache, async helpers, SSE live updates
    formatters/, import/   Locale formatting and CSV helpers
  i18n/                    en.json, ar.json, direction handling, provider
  pdf/                     Printable A4 offer, templates, sections, CSS, pagination, print portal
  mock/                    In-memory database, transport, seed data and import simulation
```

Conventions: one component per file, files under roughly 250 lines, default-export components, and
`@/` as an alias for `src/`. Shared UI belongs in `src/components/ui`; business maths belongs in
`src/lib/calculations` with unit tests.

---

## Tests, CI and deployment

Tests default to the `node` environment; React tests opt into jsdom with a
`// @vitest-environment jsdom` pragma. Useful examples: `src/lib/calculations/*.test.ts` for maths,
`src/features/offers/stepValidation.test.ts` for validation tiers, `src/pdf/*.test.*` for the
document, `src/app/roles.test.tsx` for permissions and `src/lib/cache/queryCache.test.ts` for
caching.

Documentation is versioned with the code, so review README changes like source changes. Add
markdownlint and prose linting (Vale or alex) to CI to catch broken style and link regressions
before merge.

[`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml) runs typecheck,
tests and a production build on PRs and pushes to `master` / `main`. On `master` / `main` it bumps
`package.json` (minor for `feat/*` / `feature/*` branches, patch otherwise, with a `[skip ci]`
commit) and deploys the prebuilt app to Vercel. A manual run can choose `patch`, `minor` or `none`.
Runs for the same ref are queued, never cancelled. [`vercel.json`](vercel.json) rewrites all paths to
`/index.html` for SPA routing and disables Git deployments; the footer displays the version from
`package.json`.

---

## Common changes

- **Add a page:** create it under `src/features/<area>/pages`, add it to `src/app/router.tsx`, add
  navigation and breadcrumb entries in `src/app/navigation.ts`, and guard it with
  `RequirePermission` if needed.
- **Add an API call:** put it in that feature's `api.ts` using `api` from `src/lib/api/client.ts`,
  invalidate the right cache tags, and add a mock route if mock mode should support it.
- **Change a calculation:** edit `src/lib/calculations/*` or `src/features/offers/calculations.ts`
  and add a unit test. Keep the backend calculator (`OfferCalculator.cs`) in sync.
- **Change printed text or layout:** edit `pdf/templates/*`, `pdf/sections/*` or `document.css`;
  use logical properties and run `pnpm test`.
- **Add UI copy:** add the key to both `src/i18n/en.json` and `ar.json`; `TranslationKey` is
  generated from `en.json`.
- **Switch to the real backend:** copy `.env.example` to `.env`, set `VITE_API_BASE_URL` to the
  backend `/api` URL and `VITE_USE_MOCK=false`; no feature module changes are needed.

---

## Current state and gotchas

Phases 1 and 2 (shell, calculations, mock API, offer builder, printed document) are complete, as are
the Customers, Products, Banks, Import and Users screens. `/settings` and `/account` still show
`PhasePlaceholder`; side-by-side document comparison and final polish are future phases in
[Phase.md](Phase.md).

Things that surprise new developers:

- Mock login accepts any non-empty credentials and signs in as `db.session.userId` (Admin by
  default); there is no role-switcher UI. Tests switch roles by changing that field.
- The 1% "other tax" is a **deduction**, subtracted from the total.
- Only the first offer shows the sequence input; `sequence > 0` is the signal to send
  `serialNumber`.
- Save-as-draft is deliberately weaker than issuing; issuing is create + status patch.
- The details-page language toggle is view-only; PDF language and app language are separate.
- The mock lacks server calculation, revise/update and lookup endpoints. The unused
  `mock/fixtures/calculate.response.json` is legacy.
- React tests need the jsdom pragma; `vite.config.ts` defaults to `node`.
- Deleting a customer, product or offer removes its whole offer chain in the mock.

---

## Further reading

- [AGENTS.md](AGENTS.md) — agent rules, canonical structure and business invariants.
- [srs.md](srs.md) — original requirements, database schema and printed layout reference (spec,
  not current code).
- [Phase.md](Phase.md) — delivery phases and what remains.
- [CHANGELOG.md](CHANGELOG.md) — shipped features and fixes.
- [Backend API reference](../backend/Sales%20Portal/docs/API.md) — authoritative endpoints, DTOs
  and offer rules.
