import type { TranslationParams } from "./types"

type Tree = Record<string, unknown>

/** Reads a dot separated path from a translation tree. */
export function lookup(tree: Tree, key: string): string | undefined {
  const segments = key.split(".")
  let current: unknown = tree

  for (const segment of segments) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Tree)[segment]
  }

  return typeof current === "string" ? current : undefined
}

/** Replaces `{placeholder}` slots with the supplied values. */
export function interpolate(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/**
 * Resolves a key against the active tree and falls back to the English tree so
 * a missing translation never renders an empty label.
 */
export function translate(
  tree: Tree,
  fallbackTree: Tree,
  key: string,
  params?: TranslationParams,
): string {
  const template = lookup(tree, key) ?? lookup(fallbackTree, key) ?? key
  return interpolate(template, params)
}
