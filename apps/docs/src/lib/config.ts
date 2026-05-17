/**
 * Configuration du portail développeur.
 *
 * NEXT_PUBLIC_API_V2_BASE_URL — URL de base utilisée dans les snippets curl/JS/etc.
 *                               Local : http://localhost:3333/api/v2
 *                               Prod  : https://api.fakturapp.cc/api/v2 (ou /v2 selon le sous-domaine)
 *
 * NEXT_PUBLIC_DASHBOARD_URL — URL de l'app Faktur principale (pour les liens "go to dashboard").
 *                             Local : http://localhost:3000
 *                             Prod  : https://fakturapp.cc
 */

const DEFAULT_API_V2_BASE_URL = 'https://api.fakturapp.cc/api/v2'
const DEFAULT_DASHBOARD_URL = 'https://fakturapp.cc'

export const API_V2_BASE_URL: string =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_V2_BASE_URL
    ? process.env.NEXT_PUBLIC_API_V2_BASE_URL.replace(/\/+$/, '')
    : DEFAULT_API_V2_BASE_URL

export const DASHBOARD_URL: string =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DASHBOARD_URL
    ? process.env.NEXT_PUBLIC_DASHBOARD_URL.replace(/\/+$/, '')
    : DEFAULT_DASHBOARD_URL
