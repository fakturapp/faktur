/**
 * URLs externes pilotées par env, avec valeurs par défaut prod.
 *
 * NEXT_PUBLIC_DOCS_URL — Portail développeur (Quickstart, référence, recettes).
 *                       Local : http://localhost:3001
 *                       Prod  : https://developers.fakturapp.cc
 *
 * NEXT_PUBLIC_API_V2_BASE_URL — URL de base de l'API publique V2 montrée dans
 *                               les snippets de code et le bouton "tester".
 *                               Local : http://localhost:3333/api/v2
 *                               Prod  : https://api.fakturapp.cc/v2 (ou /api/v2)
 */

const DEFAULT_DOCS_URL = 'https://developers.fakturapp.cc'
const DEFAULT_API_V2_BASE_URL = 'https://api.fakturapp.cc/api/v2'

export const DOCS_URL: string =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DOCS_URL
    ? process.env.NEXT_PUBLIC_DOCS_URL.replace(/\/+$/, '')
    : DEFAULT_DOCS_URL

export const API_V2_BASE_URL: string =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_V2_BASE_URL
    ? process.env.NEXT_PUBLIC_API_V2_BASE_URL.replace(/\/+$/, '')
    : DEFAULT_API_V2_BASE_URL

export function docsPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${DOCS_URL}${normalized}`
}
