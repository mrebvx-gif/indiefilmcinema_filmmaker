// Stores access token in memory (not localStorage — XSS protection)
let accessToken: string | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

// Authenticated fetch wrapper
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!accessToken) {
    // Try to refresh
    const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' })
    if (refreshResponse.ok) {
      const data = await refreshResponse.json()
      accessToken = data.accessToken
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      'Content-Type': 'application/json',
    },
  })
}
