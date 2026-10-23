# technocom-sales-portal

React + Vite + TypeScript + Tailwind CSS application for the TECHNOCOM
quotations workspace.

## Development server

A Vite development server is **already running** on `$PORT` (default 8443). You
don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project structure

This is the canonical project structure. Start with task-relevant files below.
Only follow imports or inspect other files when required, when a documented
path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/app/App.tsx` into the `#root` element
- `src/app/` - router, providers and layout shell
  - `src/app/App.tsx` - application root; registers the API transport and mounts the providers
  - `src/app/router.tsx` - route table of the workspace
  - `src/app/providers/AppProviders.tsx` - i18n, PDF language, toast, session and router providers
  - `src/app/layout/` - sidebar, top bar, page header, login screen, footer, mobile bottom bar
  - `src/app/navigation.ts` - navigation items and breadcrumb labels
- `src/components/ui/` - shared UI: buttons, inputs, selects, textareas, fields, tables, dialogs, badges, toasts, toggle, stepper, spinner, icons
- `src/features/` - one folder per business area
  - `src/features/offers/` - offer builder, list, details, hooks, api
    - `src/features/offers/calculations.ts` - pure maths of a draft (line amounts, totals, reference, due date, scheduled packages)
    - `src/features/offers/draft.ts` - draft creation and draft to offer conversion
    - `src/features/offers/document.ts` - maps an offer to the data of the printed document
  - `src/features/customers/` - customer directory and history
  - `src/features/products/` - materials and products catalogue
  - `src/features/import/` - data import flow
  - `src/features/settings/` - company, packaging types, bank accounts, reminders
  - `src/features/account/` - profile, preferences, session
- `src/pdf/` - the printed offer
  - `src/pdf/OfferDocument.tsx` - the document, mirrors itself in Arabic
  - `src/pdf/OfferDocumentPreview.tsx` - scaled preview used by the builder and the details page
  - `src/pdf/sections/` - one component per block of the document
  - `src/pdf/templates/` - English and Arabic document strings
  - `src/pdf/document.css` - A4 layout of the document
  - `src/pdf/print.css` - `@page` rules, repeated table headers, hidden app chrome
  - `src/pdf/PrintProvider.tsx` - prints the document on its own, in a portal outside the application
  - `src/pdf/format.ts` - document formatting (numbers, dates, packaging summary, category names)
  - `src/pdf/PdfLanguageProvider.tsx` - the document language setting
- `src/lib/` - business logic
  - `src/lib/calculations/` - packaging, tax, other tax subtraction, due date, reference number (with unit tests)
  - `src/lib/formatters/` - number, currency and date formatting
  - `src/lib/api/` - API client and transport registry
  - `src/lib/hooks/` - shared React hooks
- `src/i18n/` - `en.json`, `ar.json`, direction handling and the i18n provider
- `src/mock/` - temporary sample data and the mock transport behind the API layer
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, test and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, Vitest and the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19, React DOM 19 and React Router 7
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, `@vitejs/plugin-react` and Vitest 5
- Formatting: oxfmt

## Commands

- `pnpm dev` - start the development server
- `pnpm build` - production build
- `pnpm preview` - preview the production build
- `pnpm typecheck` - TypeScript check
- `pnpm test` - run the unit tests once
- `pnpm test:watch` - run the unit tests in watch mode
- `pnpm format` - format the sources with oxfmt

## Business rules

- **Reference number**: `{sequence}/{MONTH.}/YL/AA`, the month always follows the
  issue date. See `src/lib/calculations/reference.ts`.
- **Packaging**: a line quantity is `packages × weight per package`; a material
  may mix several packaging types. See `src/lib/calculations/packaging.ts`.
- **Tax**: tax is added to the subtotal, the "other tax" row is calculated from
  the subtotal and **subtracted** from the total. See
  `src/lib/calculations/tax.ts`.
- **Due date**: the issue date shifted by the payment term. See
  `src/lib/calculations/dueDate.ts`.
- **Page size**: the printed area of an A4 page with 15mm margins, so the
  document is 180mm wide. The preview shows a real 210 × 297mm sheet with the
  same margins, and scales the whole sheet to fit the panel. Never scale the
  document on its own, the white sheet and the document have to stay together.
- **Languages**: the application language and the PDF language are two separate
  settings. The Arabic document is a full mirror of the English one: the
  container switches to `dir="rtl"`, every block and every table flips, and
  the packaging names are translated. Only the reference number keeps its own
  direction. Use logical CSS properties in `src/pdf/document.css` so the
  mirroring is automatic, and isolate the Latin values with the `doc-ltr`
  class instead of putting `direction: ltr` on a table cell, which would
  also flip the meaning of `text-align: end`.
- **Printing**: never call `window.print()` from a page, it would print the
  whole workspace. Use `usePrintOffer()` from `src/pdf/PrintProvider.tsx`, it
  renders the document in a portal outside of the application so that only the
  document reaches the printer.

## API layer

Feature modules never import the mock data directly. They call their own
`api.ts` module, which uses the shared client in `src/lib/api`. The mock
transport in `src/mock` is registered once in `src/app/App.tsx`; a backend
replaces that single registration with an HTTP transport.

The backend already exists in `../backend` (ASP.NET Core 8, EF Core,
PostgreSQL). Its answers use the same field names as the mock, the material
id is exposed as `productId` and the printed number as `reference`, so the
HTTP transport can replace the mock one without touching a feature module.
See `../backend/README.md` for the endpoints, the data model and the money
rules.

Routes served by the mock transport:

- `GET /offers` - list, filter and search the offers
- `GET /offers/:id` - one offer
- `POST /offers` - create an offer
- `PATCH /offers/:id` - update the status of an offer
- `GET /offers/next-sequence` - the next reference sequence
- `GET /offers/:id/versions` - the version chain of an offer

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

Tailwind emits utility classes in `@layer utilities`, and CSS outside any cascade layer overrides every layer regardless of specificity. Put global element styles, such as resets and defaults for `body`, headings, `button`, or `input`, inside `@layer base { ... }` so utility classes on those elements still apply. Tailwind's Preflight already applies `box-sizing: border-box`, removes default margins, and sets `font: inherit` on form controls, so do not repeat those rules.

## Code quality

- Keep every file below roughly 250 lines; one component per file.
- Shared UI belongs in `src/components/ui`.
- Business maths belongs in `src/lib/calculations` and must be covered by unit tests.
- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
