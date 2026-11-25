# TECHNOCOM Sales Portal — frontend

Internal workspace for the TECHNOCOM sales team to create, calculate, version, search and print
quotations / proforma offers (عروض الأسعار). This repository is the React frontend; the ASP.NET Core
8 + PostgreSQL backend lives in `../backend/Sales Portal` (API docs:
`../backend/Sales Portal/docs/API.md`).

The app is bilingual in two independent senses: the **workspace** switches between English and
Arabic, and each **printed offer** carries its own English or Arabic document language, saved with
the offer.

---

## 1. Start here

Requirements: **Node 22** and **pnpm 10** (see `.mise.toml`).

```bash
cp .env.example .env     # point VITE_API_BASE_URL at the backend
pnpm install
pnpm dev                 # Vite on $PORT, default 8443
```

A dev server is already running in this environment on `$PORT` (default `8443`); use the preview
panel. Source changes hot-reload.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server (`host: true`, `strictPort`) |
| `pnpm build` | Production bundle |
| `pnpm preview` | Serve the built bundle |
| `pnpm typecheck` | `tsc --noEmit`, strict mode |
| `pnpm test` / `pnpm test:watch` | Vitest, once / watch |
| `pnpm format` | oxfmt |

**Mock mode:** set `VITE_USE_MOCK=true` (or `VITE_API_MODE=mock`) to run without a backend. The
mock is an in-memory, non-persistent database; a reload restores the seed data. Vitest forces mock
mode in `vite.config.ts`, so tests never touch a real API. Production/CI builds set
`VITE_USE_MOCK=false` and require `VITE_API_BASE_URL`.

`srs.md` is the original specification and is useful for intent and domain background, but it is
**not** an implementation description: it names React 18, TanStack Query/Table, React Hook Form +
Zod and `react-to-print`. The code actually uses React 19, a small in-house query cache, plain
controlled forms and a print portal. Trust the code and this README for current behaviour.

---

## 2. Stack at a glance

- React 19, React Router 7, TypeScript 5.7 (`strict`), Vite 8.
- Tailwind CSS v4 via `@tailwindcss/vite`; theme tokens live in `src/index.css`, no Tailwind config.
- Vitest 5 + jsdom (jsdom opted into per test file), oxfmt for formatting.
- `sileo` for toasts; custom `DataTable`, skeletons and dialogs instead of a component library.

---

## 3. Repo map

```text
src/
  main.tsx                 React root; imports index.css and mounts <App/>
  index.css                Tailwind import, theme tokens, base styles, fonts
  app/                     Router, providers and layout shell
    App.tsx                Registers the API transport, mounts providers + router
    AppProviders.tsx       Provider nesting order
    router.tsx             Route table and login gate
    navigation.ts          Sidebar items + breadcrumb labels
    RequirePermission.tsx  Route-level permission guard
    layout/                Sidebar, Topbar, PageHeader, AppShell, login, footer, placeholder
    pages/                 NotFound, Forbidden
  components/
    ui/                    Buttons, inputs, dialogs, tables, badges, toasts, skeletons, icons...
    pickers/               Customer/material search modals + shared lookup hook
    PagedTable.tsx         Table + loading/empty/error/pagination states
    TableState.tsx         State renderer used by PagedTable
  features/
    offers/                Builder, list, details, calculations, draft mapping, statuses
    customers/             Directory and per-customer offer history
    products/              Materials catalogue
    banks/                 Bank accounts CRUD
    import/                CSV import wizard and history
    settings/              Catalog/settings API + types (page is a placeholder)
    account/               Session, permissions, account page (placeholder)
    users/                 Admin user management
  lib/
    api/                   Typed api client, transport registry, HTTP transport, errors, lookup
    calculations/          Pure offer maths + unit tests
    formatters/            Number, currency, date and locale helpers
    cache/queryCache.ts    Tiny tag-based in-memory cache
    hooks/                 useAsyncData, useDelete
    import/                CSV parsing, templates, preview
  i18n/                    en.json / ar.json, typed keys, direction, provider
  pdf/                     Printable A4 offer, templates, sections, CSS, pagination, print portal
  mock/                    In-memory DB, transport, seed data and import simulation
```

Conventions: one component per file, keep files under ~250 lines, default-export components, use
`@/` for `src/`. Shared UI goes in `src/components/ui`; business maths goes in
`src/lib/calculations` with unit tests.

---

## 4. Boot, routing and access control

`index.html` → `src/main.tsx` → `src/app/App.tsx` → `AppProviders` → `AppRouter` → `AppShell`.

`App.tsx` chooses the API transport at module load: mock when `VITE_USE_MOCK === "true"` or
`VITE_API_MODE === "mock"`, HTTP otherwise. `getTransport()` lazily falls back to HTTP if nothing
registered in time.

Provider order (outermost first), in `AppProviders.tsx`:

1. `I18nProvider` — workspace language/direction.
2. `PdfLanguageProvider` — document language (independent).
3. `ToastProvider` — sileo toasts; corner follows app direction.
4. `SessionProvider` — login/session.
5. `PrintProvider` — print portal mounted outside the app.
6. `BrowserRouter` — then `AppRouter`.

If unauthenticated, **every URL** renders `LoginScreen`; successful login always navigates to `/`.
A `401` from the HTTP transport clears `sales_portal_jwt` and `technocom.session` and hard-redirects
to `/login`.

Authenticated routes (all under `AppShell`):

| Path | Page | Guard |
| --- | --- | --- |
| `/` | Dashboard | — |
| `/offers` | Offer list | — |
| `/offers/new` | Offer builder | `offers.write` |
| `/offers/:id` | Offer details, versions, status | — |
| `/customers`, `/customers/:id` | Directory, history | — |
| `/products` | Materials | — |
| `/banks` | Bank accounts | — |
| `/import` | Import wizard | `import.use` |
| `/users` | Users | `users.manage` |
| `/settings`, `/account` | Placeholder screens | — |
| `/home`, `/login` | Redirects to `/` | — |
| `*` | Not found | — |

Roles are `Admin`, `Sales`, `Accountant` (`src/features/account/permissions.ts`), with seven
permissions: `offers.write`, `offers.delete`, `catalog.create`, `catalog.edit`, `catalog.delete`,
`import.use`, `users.manage`. Admin has all; Sales cannot edit catalog, import or manage users;
Accountant has read-only offers and no user management. The matrix mirrors backend `Policies.cs`.
Route guards exist only on the three paths above; other write actions are hidden per page with
`usePermissions().can(...)` and enforced again by the API.

Local storage keys: `sales_portal_jwt`, `technocom.session`, `technocom.app-language`,
`technocom.pdf-language`. Signing out clears the session, token and query cache.

---

## 5. Data flow

```text
page → feature api.ts → src/lib/api/client.ts → transport (mock | HTTP) → backend
                     ↘ src/lib/cache/queryCache.ts (tags + 2 min TTL)
```

- **Feature modules call their own `api.ts`; they must not import mock data directly.**
- `Transport` is a single `(path, options) => Promise<unknown>` function. `registerTransport()`
  swaps implementations; the mock registers itself on import. The HTTP transport prefixes `/api/`,
  sends the bearer token, uses `XMLHttpRequest` only for upload progress, and throws `ApiError`
  with `status`, `detail` and optional field `errors`.
- `src/lib/api/lookup.ts` provides `PaginatedResult<T>`, `paginate()` and natural-sorting search
  helpers shared by mock routes and picker fallbacks.
- `src/lib/cache/queryCache.ts` caches by key with tags `customers`, `materials`, `banks`, `catalog`;
  writes invalidate the relevant tags. Failed requests are never cached and stale in-flight
  responses are discarded.
- `useAsyncData()` supplies `{ data, loading, error, reload, refresh, mutate }`; `mutate()` returns a
  rollback function for optimistic updates. `useDelete()` shares confirm/busy/toast behaviour.
  `PagedTable` + `TableState` render loading, empty, error and page states consistently.
- Pickers call `/customers/lookup` and `/materials/lookup` directly through `api`, with a local
  fallback when those endpoints are unavailable (as in mock mode).

Endpoint groups (exact paths are in each `src/features/*/api.ts`): auth (`/auth/login`, `/auth/me`),
offers (`/offers`, `/offers/calculate`, `/offers/next-sequence`, `/offers/:id/versions`,
`POST /offers/:id/revise`, `PATCH /offers/:id/status`), customers (`/customers`, `/customers/:id/offers`,
`/customers/lookup`), materials (`/materials`, `/materials/lookup`), banks, settings/catalog,
users, and import (`/import/templates/:type`, `/import/:type/preview`, `/import/:id/commit`,
`/import/history`). The mock implements most of these with 120 ms latency and permission checks on
deletes; it lacks server calculation, revise/update and lookup routes. The full backend contract is
in `../backend/Sales Portal/docs/API.md`.

**Field mappings** to keep in mind: backend `materialId` ↔ frontend `productId`/line
`materialId`; `customerCode` ↔ `code`; `defaultPaymentTermId` ↔ `paymentTermId`;
`itemCode` ↔ `code`; `referencePricePerKg` ↔ `referencePrice`. Statuses arrive capitalized from the
API and are lowercased by `features/offers/mappers.ts`. Settings arrive either flat (mock `/settings`)
or as `{ company, workspace: { bankAccounts, ... } }` (backend); `normalizeSettings()` merges both
shapes with `/catalog/bootstrap`.

---

## 6. Offer domain rules

The builder has five steps — `basics`, `packaging`, `taxes`, `delivery`, `notes` — implemented in
`src/features/offers/stepValidation.ts`. Steps after the first incomplete one are locked; going back
is always allowed; Next shows errors instead of advancing. **Save as draft** only checks issues that
block a draft (customer, at least one line, at least one bank); **issue** checks every step.
Issuing is `POST /offers` followed by `PATCH /offers/:id/status` with `issued` — not a special create
payload. Statuses: `draft`, `issued`, `accepted`, `rejected` (backend also documents `Cancelled`).
Allowed transitions: `Draft → Issued → Accepted|Rejected`. Deleting/revising works on the whole
version chain.

**Reference** (`src/lib/calculations/reference.ts`): `{Loc|Int}/{0000 sequence}-{year}/YL/{initials}`,
e.g. `Loc/0042-2026/YL/JD`. It is never typed. Offer type, sequence, issue date year and user
initials build it; changing type or date rewrites those segments. Sequence is global, suggested by
the server, and only the very first offer shows a starting-sequence input. Legacy references without
a year are still parsed for their sequence.

**Money** (`src/lib/calculations`, `src/features/offers/calculations.ts`; amounts rounded to 2 dp):

```text
lineQuantityKg = weightPerPackageKg × packages      // a material may mix packaging rows
lineAmount     = lineQuantityKg × ratePerKg × (1 - lineDiscountPercent/100)
subtotal       = Σ lineAmount
netBeforeTax   = subtotal - orderDiscount + extraExpenses
taxAmount      = netBeforeTax × taxPercent / 100    // added
otherTaxAmount = netBeforeTax × 1 / 100             // fixed 1% deduction when enabled
total          = netBeforeTax + taxAmount - otherTaxAmount
balanceDue     = total - advancePayment
dueDate        = issueDate + paymentTerm.days
expiryDate     = issueDate + validityDays           // 0 hides the validity row
```

The frontend local maths also has `extraExpenses`, `advancePayment` and `balanceDue`; the backend
calculator is authoritative for saved offers and does **not** store those three fields. It rounds
weights to 3 dp, applies discounts at order level (not per line), and clamps delivery allocations to
the remaining packages of each packaging row. The builder debounces `POST /offers/calculate` by
250 ms with cancellation and uses the server response for reference/due date and validation
warnings; local `calculateDraft()` keeps the preview instant.

**Delivery** can be free text or batches. Batches allocate packages per material/packaging row,
tracking ordered, scheduled and remaining quantities; helpers in `draft.ts` reconcile allocations
when lines change. **Bank selection** requires at least one account (defaults to the first two
active on a new draft). **New version** opens `/offers/new?from=<id>` and prefills `version + 1`
with `parentOfferId`; `VersionHistory` lists versions newest-first.

---

## 7. The printed offer

`src/pdf/` turns an offer into paginated A4 HTML that is printed by the browser.

- `OfferDocument.tsx` renders the document; `buildDocumentData()` / `offerToDocumentSource()` in
  `features/offers/document.ts` map stored offers (including `document.items` snapshots) into its
  input. Fixed labels live in `pdf/templates/en.ts` and `ar.ts`, one section component per block in
  `pdf/sections/`, formatting in `format.ts` and `arabicDigits.ts`.
- Page metrics: sheet `210 × 297 mm`, margins `12.7 mm`, content `184.6 × 271.6 mm`. The preview
  renders a real sheet and scales the **whole sheet** (`OfferDocumentPreview.tsx`,
  `scale = min(1, availableWidth / 794)`); never scale the document alone.
- `paginate.ts` splits into pages, clones header/footer, repeats table headings and keeps sub-rows,
  totals, delivery/bank tables and terms unbroken.
- Arabic mirrors English: container `dir="rtl"`, logical CSS properties in `document.css`, Latin
  values isolated with `.doc-ltr` (`direction: ltr; unicode-bidi: isolate`), and Arabic-Indic digits
  except inside `[data-latin]`. Do not put `direction: ltr` on a table cell — it flips the meaning
  of `text-align: end`.
- **Never call `window.print()` from a page.** Use `usePrintOffer()` from `PrintProvider.tsx`; it
  renders `OfferDocument` into a `#print-root` portal outside `#root`, then prints. `print.css`
  hides the workspace and applies `@page { size: A4 portrait; margin: 0 }`.

---

## 8. Languages

Two unrelated settings, both persisted:

- App language (`src/i18n/`): `technocom.app-language`, `en` (default) or `ar`. Sets `<html lang>`
  and `dir`, changes the font, selects `en.json`/`ar.json`, and switches toast placement. Keys are
  typed dot-paths derived from `en.json`; missing Arabic keys fall back to English.
- Document language (`src/pdf/PdfLanguageProvider.tsx`): `technocom.pdf-language`, `en` or `ar`.
  Used for new drafts and printing. On the details page, the language toggle changes only the
  viewed/printed document — it does not rewrite the saved offer.

---

## 9. Tests, CI and deployment

Tests default to the `node` environment; React tests opt into jsdom with a
`// @vitest-environment jsdom` pragma and seed the mock DB. Good examples:
`src/lib/calculations/*.test.ts` for maths, `src/features/offers/stepValidation.test.ts` for
validation tiers, `src/pdf/document.test.tsx` + `paginate.test.ts` + `print.test.tsx` for the
document, `src/app/roles.test.tsx` for permissions, `src/lib/cache/queryCache.test.ts` for caching.

`.github/workflows/deploy-frontend.yml` runs typecheck, tests and a production build on PRs and
pushes. On `master`/`main` it bumps `package.json` (minor for `feat/*`/`feature/*` branches, patch
otherwise, with a `[skip ci]` commit) and deploys the prebuilt app to Vercel. Runs for the same ref
are queued, never cancelled. `vercel.json` rewrites all paths to `/index.html` (SPA routing) and
disables Git deployments; the footer displays the version from `package.json`.

Environment variables: `VITE_API_BASE_URL`, `VITE_USE_MOCK`, `VITE_API_MODE` (undocumented in
`.env.example`), and `PORT` for the dev/preview server. Never commit `.env`.

---

## 10. Common tasks

- **Add a page:** create the page under `src/features/<area>/pages`, add it to `src/app/router.tsx`,
  add nav/breadcrumb entries in `src/app/navigation.ts`, and guard it with `RequirePermission` if
  needed.
- **Add an API call:** put it in that feature's `api.ts` using `api` from `src/lib/api/client.ts`,
  invalidate the right cache tags, and add a mock route if mock mode should support it.
- **Change a calculation:** edit `src/lib/calculations/*` or `src/features/offers/calculations.ts`
  and add a unit test. Keep the backend calculator (`OfferCalculator.cs`) in sync.
- **Change printed text/layout:** edit `pdf/templates/*`, `pdf/sections/*` or `document.css`; use
  logical properties and run `pnpm test`.
- **Add UI copy:** add the key to both `src/i18n/en.json` and `ar.json`; `TranslationKey` is
  generated from `en.json`.
- **Switch to the real backend:** copy `.env.example` to `.env`, set `VITE_API_BASE_URL` to the
  backend `/api` URL and `VITE_USE_MOCK=false`; no feature module changes needed.

---

## 11. Current state and gotchas

Phases 1 and 2 (shell, calculations, mock API, offer builder, printed document) are complete.
`Customers`, `Products`, `Banks`, `Import` and `Users` screens are implemented; `/settings` and
`/account` are still `PhasePlaceholder` screens. Side-by-side document comparison and final polish
are future phases — see `PHASES.md`.

Things that surprise new developers:

- Mock login accepts any non-empty credentials and signs in as `db.session.userId` (Admin by
  default); there is no role-switcher UI. Tests switch roles by changing that field.
- The 1% "other tax" is a **deduction**, subtracted from the total.
- Only the first offer shows the sequence input; `sequence > 0` is the signal to send
  `serialNumber`.
- Save-as-draft is deliberately weaker than issuing; issuing is create + status patch.
- The details-page language toggle is view-only; PDF language and app language are separate.
- The mock lacks server calculation, revise/update and lookup endpoints; those only work against
  the backend. The unused flat `mock/fixtures/calculate.response.json` is legacy.
- React tests need the jsdom pragma; `vite.config.ts` defaults to `node`.
- Deleting a customer/product/offer removes its whole offer chain in the mock.

---

## Further reading

- `AGENTS.md` — agent rules, canonical structure and business invariants.
- `srs.md` — original requirements, database schema and printed layout reference (spec, not current code).
- `PHASES.md` — delivery phases and what remains.
- `CHANGELOG.md` — shipped features and fixes.
- `../backend/Sales Portal/docs/API.md` — authoritative backend endpoints, DTOs and offer rules.
