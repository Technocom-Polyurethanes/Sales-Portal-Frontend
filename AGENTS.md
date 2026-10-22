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
  - `src/features/customers/` - customer directory and history
  - `src/features/products/` - materials and products catalogue
  - `src/features/import/` - data import flow
  - `src/features/settings/` - company, packaging types, bank accounts, reminders
  - `src/features/account/` - profile, preferences, session
- `src/pdf/` - `OfferDocument`, Arabic and English templates, print styles, PDF language provider
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
- **Languages**: the application language and the PDF language are two separate
  settings. The Arabic document keeps the same layout as the English one; only
  the text changes.

## API layer

Feature modules never import the mock data directly. They call their own
`api.ts` module, which uses the shared client in `src/lib/api`. The mock
transport in `src/mock` is registered once in `src/app/App.tsx`; a backend
replaces that single registration with an HTTP transport.

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
