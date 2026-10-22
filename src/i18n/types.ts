import type en from "./en.json"

/** Shape of the translation trees (`en.json` / `ar.json`). */
export type TranslationTree = typeof en

/**
 * Dot separated path of every leaf string in the tree, e.g.
 * `"offers.builder.steps.basics"`.
 */
type Paths<T,> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`
}[keyof T & string]

export type TranslationKey = Paths<TranslationTree>

/** Values injected into `{placeholder}` slots. */
export type TranslationParams = Record<string, string | number>
