const MISSING_API_BASE_URL_MESSAGE =
  "Configuration API manquante. Définissez NEXT_PUBLIC_API_URL dans l'environnement de déploiement."

function normalizeBaseUrl(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value || value === "undefined" || value === "null") return null
  return value.replace(/\/+$/, "")
}

export function getApiBaseUrl(): string | null {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
}

export function requireApiBaseUrl(): string {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error(MISSING_API_BASE_URL_MESSAGE)
  }
  return baseUrl
}

export function getMissingApiBaseUrlMessage(): string {
  return MISSING_API_BASE_URL_MESSAGE
}

